// Add S3 multipart endpoints and resumable support
import { Router } from 'express'
import { prisma } from '../prismaClient'
import authMiddleware from '../middleware/auth'
import adminMiddleware from '../middleware/admin'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { generateSignedUpload } from '../utils/s3'
import { transcodeQueue } from '../queues/transcodeQueue'
import { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const router = Router()

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const MAX_VIDEO_MB = Number(process.env.MAX_VIDEO_MB || '1024') // 1GB default
const MAX_IMAGE_MB = Number(process.env.MAX_IMAGE_MB || '10') // 10MB default
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || String(1024 * 1024 * 1024)) // 1GB

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g,'_')
    cb(null, safeName)
  }
})

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } })

// Return a signed-url using S3 if configured, otherwise a mock upload endpoint
router.post('/signed-url', authMiddleware, adminMiddleware, async (req,res)=>{
  const { filename, targetType, targetId } = req.body
  if(!filename) return res.status(400).json({message:'filename required'})

  const awsConfigured = !!process.env.AWS_S3_BUCKET && !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY && !!process.env.AWS_REGION
  if(!awsConfigured){
    const uploadUrl = '/api/admin/uploads/mock'
    const fileUrl = `/uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g,'_')}`
    return res.json({ uploadUrl, fileUrl, method: 'POST' })
  }

  try{
    // Determine content type hint from filename
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    if(['.jpg','.jpeg'].includes(ext)) contentType = 'image/jpeg'
    if(['.png'].includes(ext)) contentType = 'image/png'
    if(['.webp'].includes(ext)) contentType = 'image/webp'
    if(['.mp4'].includes(ext)) contentType = 'video/mp4'

    const { uploadUrl, fileUrl, key } = await generateSignedUpload(filename, contentType)
    // Instruct client to PUT the file to uploadUrl, and then call /notify with key for ingestion/transcode
    return res.json({ uploadUrl, fileUrl, key, method: 'PUT' })
  }catch(err:any){
    console.error('Signed URL generation failed', err)
    return res.status(500).json({ message: 'Signed URL generation failed' })
  }
})

// S3 multipart init (server creates multipart upload and presigned URLs for parts)
router.post('/s3-multipart/init', authMiddleware, adminMiddleware, async (req,res)=>{
  const { filename, totalSize, partSize } = req.body
  if(!filename || !totalSize || !partSize) return res.status(400).json({ message: 'filename, totalSize and partSize required' })
  if(!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) return res.status(400).json({ message: 'S3 not configured' })

  const { S3Client, CreateMultipartUploadCommand, UploadPartCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  const s3 = new S3Client({ region: process.env.AWS_REGION })
  const bucket = process.env.AWS_S3_BUCKET!
  const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g,'_')}`

  const createCmd = new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, ContentType: req.body.contentType || 'application/octet-stream' })
  try{
    const createResp:any = await s3.send(createCmd)
    const uploadId = createResp.UploadId
    const parts = Math.ceil(totalSize / partSize)
    const urls: string[] = []
    for(let i=1;i<=parts;i++){
      const uploadPartCmd = new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: i })
      const presigned = await getSignedUrl(s3, uploadPartCmd, { expiresIn: 60*60 })
      urls.push(presigned)
    }
    return res.json({ uploadId, key, urls })
  }catch(err:any){
    console.error('Multipart init failed', err)
    return res.status(500).json({ message: 'Multipart init failed' })
  }
})

// S3 multipart complete
router.post('/s3-multipart/complete', authMiddleware, adminMiddleware, async (req,res)=>{
  const { uploadId, key, parts, targetType, targetId } = req.body
  if(!uploadId || !key || !parts) return res.status(400).json({ message: 'uploadId, key and parts required' })
  if(!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) return res.status(400).json({ message: 'S3 not configured' })

  const { S3Client, CompleteMultipartUploadCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({ region: process.env.AWS_REGION })
  const bucket = process.env.AWS_S3_BUCKET!

  const params = {
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts.map((p:any)=>({ ETag: p.etag, PartNumber: Number(p.partNumber) })) }
  }

  try{
    const cmd = new CompleteMultipartUploadCommand(params as any)
    const resp:any = await s3.send(cmd)
    const cloudfront = process.env.CLOUDFRONT_DOMAIN
    const publicUrl = cloudfront ? `https://${cloudfront}/${key}` : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    // enqueue transcode job
    await transcodeQueue.add('transcode-job', { key, targetType, targetId }, { attempts:3, backoff:{ type:'exponential', delay:60000 }, removeOnComplete:100, removeOnFail:1000 })
    return res.json({ fileUrl: publicUrl })
  }catch(err:any){
    console.error('Complete multipart failed', err)
    return res.status(500).json({ message: 'Complete multipart failed' })
  }
})

// Mock upload endpoint: accepts multipart and returns fileUrl, optionally link to anime/episode
router.post('/mock', authMiddleware, adminMiddleware, upload.single('file'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({message:'file required'})
    const targetType = req.body.targetType // 'anime_poster' | 'anime_cover' | 'episode_video' | 'episode_poster'
    const targetId = req.body.targetId

    const fileUrl = `/uploads/${req.file.filename}`

    // Validate file size and type after writing to disk
    const stats = fs.statSync(req.file.path)
    const sizeMB = stats.size / (1024 * 1024)
    const mime = req.file.mimetype || ''

    let allowedMB = MAX_IMAGE_MB
    if(mime.startsWith('video/') || targetType === 'episode_video') allowedMB = MAX_VIDEO_MB

    if(sizeMB > allowedMB){
      fs.unlinkSync(req.file.path)
      return res.status(413).json({ message: `File too large. Max allowed for this type is ${allowedMB} MB` })
    }

    if(targetType && targetType.startsWith('anime') && !mime.startsWith('image/')){
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ message: 'Poster/cover must be an image (png/jpg/webp)' })
    }
    if(targetType === 'episode_video' && !mime.startsWith('video/')){
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ message: 'Episode file must be a video' })
    }

    try{
      if(targetType && targetId){
        if(targetType === 'anime_poster'){
          await prisma.anime.update({ where:{ id: targetId }, data:{ posterUrl: fileUrl }})
        }else if(targetType === 'anime_cover'){
          await prisma.anime.update({ where:{ id: targetId }, data:{ coverUrl: fileUrl }})
        }else if(targetType === 'episode_video'){
          await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: fileUrl }})
        }
      }
    }catch(err){
      console.error('Linking upload failed', err)
    }

    // enqueue transcode job
    try{ await transcodeQueue.add('transcode-job', { localPath: fileUrl, targetType, targetId }, { attempts:3, backoff:{ type:'exponential', delay:60000 }, removeOnComplete:100, removeOnFail:1000 }) }catch(e){console.error('enqueue failed', e)}

    return res.json({ fileUrl })
  }catch(err:any){
    if(err.code === 'LIMIT_FILE_SIZE'){
      return res.status(413).json({ message: 'File too large' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Upload failed' })
  }
})

export default router
