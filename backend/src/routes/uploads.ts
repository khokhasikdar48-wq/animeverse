import { Router } from 'express'
import { prisma } from '../prismaClient'
import authMiddleware from '../middleware/auth'
import adminMiddleware from '../middleware/admin'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { generateSignedUpload } from '../utils/s3'

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

    return res.json({ fileUrl })
  }catch(err:any){
    if(err.code === 'LIMIT_FILE_SIZE'){
      return res.status(413).json({ message: 'File too large' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Upload failed' })
  }
})

// Notify/ingest endpoint: client or S3 event can call this after a successful upload to trigger ingestion/transcoding.
// Expected body: { key: string, targetType: 'episode_video'|'anime_asset', targetId?: string }
router.post('/notify', authMiddleware, adminMiddleware, async (req,res)=>{
  const { key, targetType, targetId } = req.body
  if(!key) return res.status(400).json({ message: 'key required' })

  // In production, enqueue a job to transcode the uploaded file (key) to HLS renditions, upload HLS to S3,
  // then set episode.videoUrl to the CloudFront HLS playlist URL (e.g., https://<cloudfront>/<hls_path>/master.m3u8).
  // Here we'll simulate the pipeline: if CLOUDFRONT_DOMAIN set, construct a URL pointing to the uploaded key (no transcoding).

  const cloudfront = process.env.CLOUDFRONT_DOMAIN
  const region = process.env.AWS_REGION
  const bucket = process.env.AWS_S3_BUCKET
  let fileUrl = ''
  if(cloudfront){
    fileUrl = `https://${cloudfront}/${key}`
  }else if(bucket && region){
    fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }else{
    // Not on S3: return ok
    fileUrl = `/uploads/${path.basename(key)}`
  }

  // If target is episode, update DB to point to this fileUrl (useful for testing). In production, set to HLS playlist URL after transcoding.
  try{
    if(targetType === 'episode_video' && targetId){
      await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: fileUrl }})
    }
  }catch(err){
    console.error('Failed to set episode url after notify', err)
  }

  // Return queued status
  return res.json({ status: 'queued', fileUrl })
})

export default router
