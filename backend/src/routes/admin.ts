import { Router } from 'express'
import { prisma } from '../prismaClient'
import authMiddleware from '../middleware/auth'
import adminMiddleware from '../middleware/admin'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

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

// Return a signed-url placeholder or real signed url when AWS creds provided
router.post('/uploads/signed-url', authMiddleware, adminMiddleware, async (req,res)=>{
  const { filename, targetType, targetId } = req.body
  if(!filename) return res.status(400).json({message:'filename required'})

  // If AWS creds not configured, return mock upload endpoint
  const awsConfigured = !!process.env.AWS_S3_BUCKET && !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY
  if(!awsConfigured){
    // return a mock upload endpoint and the eventual file URL
    const uploadUrl = '/api/admin/uploads/mock'
    const fileUrl = `/uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g,'_')}`
    return res.json({ uploadUrl, fileUrl, method: 'POST' })
  }

  // TODO: implement real S3 signed URL flow (placeholder for now)
  return res.json({ message: 'S3 flow not implemented in scaffold' })
})

// Mock upload endpoint: accepts multipart and returns fileUrl, optionally link to anime/episode
router.post('/uploads/mock', authMiddleware, adminMiddleware, upload.single('file'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({message:'file required'})
    const targetType = req.body.targetType // 'anime_poster' | 'anime_cover' | 'episode_video' | 'episode_poster'
    const targetId = req.body.targetId

    // Build public url to the uploaded file (served by express static /uploads)
    const fileUrl = `/uploads/${req.file.filename}`

    // Validate file size and type after writing to disk
    const stats = fs.statSync(req.file.path)
    const sizeMB = stats.size / (1024 * 1024)
    const mime = req.file.mimetype || ''

    // Determine allowed limits
    let allowedMB = MAX_IMAGE_MB
    if(mime.startsWith('video/') || targetType === 'episode_video') allowedMB = MAX_VIDEO_MB

    if(sizeMB > allowedMB){
      // remove the uploaded file
      fs.unlinkSync(req.file.path)
      return res.status(413).json({ message: `File too large. Max allowed for this type is ${allowedMB} MB` })
    }

    // Validate mime types
    if(targetType && targetType.startsWith('anime') && !mime.startsWith('image/')){
      // Poster/cover should be images
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
        }else if(targetType === 'episode_poster'){
          // episode poster not implemented on model yet
        }
      }
    }catch(err){
      console.error('Linking upload failed', err)
      // proceed but still return fileUrl
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

// Admin CRUD: Anime
router.get('/anime', authMiddleware, adminMiddleware, async (req,res)=>{
  const list = await prisma.anime.findMany({ orderBy:{createdAt:'desc'}, include:{genres:true}})
  return res.json({ items: list })
})

router.post('/anime', authMiddleware, adminMiddleware, async (req,res)=>{
  const { title, slug, description, year, status, rating, genreIds } = req.body
  if(!title || !slug) return res.status(400).json({message:'title and slug required'})
  const anime = await prisma.anime.create({ data: { title, slug, description, year: year||null, status, rating: rating||null }})
  // connect genres if provided
  if(Array.isArray(genreIds) && genreIds.length>0){
    await prisma.anime.update({ where:{id:anime.id}, data:{ genres: { connect: genreIds.map((id:string|number)=> ({ id: Number(id) })) } }})
  }
  return res.json({ anime })
})

router.put('/anime/:id', authMiddleware, adminMiddleware, async (req,res)=>{
  const { id } = req.params
  const { title, slug, description, year, status, rating, genreIds, posterUrl, coverUrl } = req.body
  const anime = await prisma.anime.update({ where:{ id }, data: { title, slug, description, year, status, rating: rating||null, posterUrl, coverUrl }})
  if(Array.isArray(genreIds)){
    // set genres
    await prisma.anime.update({ where:{id}, data:{ genres: { set: genreIds.map((g:any)=>({id: Number(g)})) } }})
  }
  return res.json({ anime })
})

router.delete('/anime/:id', authMiddleware, adminMiddleware, async (req,res)=>{
  const { id } = req.params
  await prisma.anime.delete({ where:{ id }})
  return res.json({ message:'deleted' })
})

// Admin: Episodes CRUD for an anime
router.get('/anime/:id/episodes', authMiddleware, adminMiddleware, async (req,res)=>{
  const { id } = req.params
  const episodes = await prisma.episode.findMany({ where:{ animeId: id }, orderBy:{ episodeNumber: 'asc' }})
  return res.json({ episodes })
})

router.post('/anime/:id/episodes', authMiddleware, adminMiddleware, async (req,res)=>{
  const { id } = req.params
  const { title, episodeNumber, description } = req.body
  if(!title || episodeNumber==null) return res.status(400).json({message:'title and episodeNumber required'})
  const ep = await prisma.episode.create({ data: { animeId: id, title, episodeNumber: Number(episodeNumber), description, videoUrl: '' }})
  // update anime totalEpisodes if needed
  await prisma.anime.update({ where:{ id }, data:{ totalEpisodes: { increment: 1 } as any } }).catch(()=>{})
  return res.json({ episode: ep })
})

router.put('/episodes/:id', authMiddleware, adminMiddleware, async (req,res)=>{
  const { id } = req.params
  const { title, episodeNumber, description, videoUrl } = req.body
  const ep = await prisma.episode.update({ where:{ id }, data:{ title, episodeNumber: episodeNumber?Number(episodeNumber):undefined, description, videoUrl }})
  return res.json({ episode: ep })
})

router.delete('/episodes/:id', authMiddleware, adminMiddleware, async (req,res)=>{
  const { id } = req.params
  await prisma.episode.delete({ where:{ id }})
  return res.json({ message:'deleted' })
})

export default router
