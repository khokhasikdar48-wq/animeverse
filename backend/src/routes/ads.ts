import { Router } from 'express'
import { prisma } from '../prismaClient'
import authMiddleware from '../middleware/auth'
import path from 'path'
import fs from 'fs'
import axios from 'axios'

const router = Router()

// Configurable via env
const AD_PROVIDER = process.env.AD_PROVIDER || 'mock' // 'mock' or custom provider
const AD_VERIFY_URL = process.env.AD_PROVIDER_VERIFY_URL || ''
const AD_API_KEY = process.env.AD_PROVIDER_API_KEY || ''
const UNLOCK_DURATION_SECONDS = Number(process.env.AD_UNLOCK_DURATION_SECONDS || String(60 * 60 * 24)) // default 24h

// Ensure uploads/logs exists (for storing ad nonces if desired)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// POST /api/ads/reward/init
// Body: { episodeId }
// Returns: { provider, adUnitId?, serverNonce }
router.post('/reward/init', authMiddleware, async (req,res)=>{
  const user = (req as any).user
  const { episodeId } = req.body
  if(!episodeId) return res.status(400).json({ message: 'episodeId required' })

  // Generate a server nonce to bind ad view to this session
  const serverNonce = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`

  // Optionally persist the nonce to validate later (lightweight)
  try{
    await prisma.adUnlockNonce.create({ data:{ userId: user.id, episodeId, nonce: serverNonce, createdAt: new Date() }})
  }catch(e){
    console.warn('Failed to persist ad nonce', e?.message || e)
  }

  // Return provider metadata; clients should use provider SDK to show the ad and obtain a completionToken.
  return res.json({ provider: AD_PROVIDER, serverNonce, adUnitId: process.env.AD_PROVIDER_AD_UNIT_ID || null })
})

// POST /api/ads/reward/verify
// Body: { episodeId, completionToken, serverNonce }
// Server verifies the completionToken with configured provider (or mock) and creates a temporary unlock record
router.post('/reward/verify', authMiddleware, async (req,res)=>{
  const user = (req as any).user
  const { episodeId, completionToken, serverNonce } = req.body
  if(!episodeId || !completionToken) return res.status(400).json({ message: 'episodeId and completionToken required' })

  // Check nonce exists (defense against replay)
  if(serverNonce){
    const found = await prisma.adUnlockNonce.findFirst({ where:{ nonce: serverNonce, userId: user.id, episodeId } })
    if(!found) return res.status(400).json({ message: 'invalid or missing serverNonce' })
  }

  // Verify with provider if configured
  let verified = false
  try{
    if(AD_PROVIDER === 'mock' || !AD_VERIFY_URL){
      // Accept a specific mock token pattern for local/dev (no forced clicks)
      if(completionToken === 'MOCK_AD_COMPLETED' || completionToken.startsWith('MOCK:')) verified = true
    }else{
      // Call provider verify endpoint
      const resp = await axios.post(AD_VERIFY_URL, { token: completionToken, nonce: serverNonce, episodeId, userId: user.id }, { headers: { 'Authorization': `Bearer ${AD_API_KEY}` }, timeout: 5000 })
      if(resp.status === 200 && resp.data && resp.data.verified) verified = true
    }
  }catch(err:any){
    console.error('Ad provider verification failed', err?.message || err)
  }

  if(!verified) return res.status(400).json({ message: 'ad verification failed' })

  // Create an unlock record with expiry
  const expiresAt = new Date(Date.now() + UNLOCK_DURATION_SECONDS * 1000)
  try{
    const unlock = await prisma.adUnlock.create({ data:{ userId: user.id, episodeId, expiresAt }})
    return res.json({ unlocked: true, expiresAt })
  }catch(err:any){
    console.error('Failed to create unlock', err)
    return res.status(500).json({ message: 'Failed to create unlock' })
  }
})

// GET /api/ads/reward/status?episodeId=...
// returns { unlocked: boolean, expiresAt?: Date }
router.get('/reward/status', authMiddleware, async (req,res)=>{
  const user = (req as any).user
  const episodeId = req.query.episodeId as string
  if(!episodeId) return res.status(400).json({ message: 'episodeId required' })

  const now = new Date()
  const existing = await prisma.adUnlock.findFirst({ where:{ userId: user.id, episodeId, expiresAt: { gt: now } }, orderBy: { expiresAt: 'desc' } })
  if(!existing) return res.json({ unlocked:false })
  return res.json({ unlocked:true, expiresAt: existing.expiresAt })
})

export default router
