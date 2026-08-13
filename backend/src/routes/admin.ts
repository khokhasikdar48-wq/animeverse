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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g,'_')
    cb(null, safeName)
  }
})
const upload = multer({ storage })

// Return a signed-url placeholder or real signed url when AWS creds provided
router.post('/uploads/signed-url', authMiddleware, adminMiddleware, async (req,res)=>{
  const { filename } = req.body
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

// Mock upload endpoint: accepts multipart and returns fileUrl
router.post('/uploads/mock', authMiddleware, adminMiddleware, upload.single('file'), async (req,res)=>{
  if(!req.file) return res.status(400).json({message:'file required'})
  // Build public url to the uploaded file (served by express static /uploads)
  const fileUrl = `/uploads/${req.file.filename}`
  return res.json({ fileUrl })
})

export default router
