import { Router } from 'express'
import { prisma } from '../../prismaClient'
import authMiddleware from '../../middleware/auth'

const router = Router()

// GET /api/admin/metrics/ads
router.get('/ads', authMiddleware, async (req,res)=>{
  const user = (req as any).user
  // Only admins should access; assume adminMiddleware exists elsewhere on routes mount
  try{
    const now = new Date()
    const since24h = new Date(Date.now() - 24 * 3600 * 1000)
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000)

    const totalUnlocksLast24h = await prisma.adUnlock.count({ where: { createdAt: { gte: since24h } } })
    const totalInitsLast24h = await prisma.adUnlockNonce.count({ where: { createdAt: { gte: since24h } } })

    // daily counts for last 7 days
    const daily: { date: string, unlocks: number, inits: number }[] = []
    for(let i=6;i>=0;i--){
      const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - i)
      const end = new Date(start); end.setDate(start.getDate()+1)
      const unlocks = await prisma.adUnlock.count({ where: { createdAt: { gte: start, lt: end } } })
      const inits = await prisma.adUnlockNonce.count({ where: { createdAt: { gte: start, lt: end } } })
      daily.push({ date: start.toISOString().slice(0,10), unlocks, inits })
    }

    // top episodes by unlocks (last 7 days)
    const topEpisodes = await prisma.$queryRawUnsafe(`
      SELECT "episodeId", count(*) as cnt FROM "AdUnlock" WHERE "createdAt">='${since7d.toISOString()}' GROUP BY "episodeId" ORDER BY cnt DESC LIMIT 10
    `)

    return res.json({ totalUnlocksLast24h, totalInitsLast24h, daily, topEpisodes })
  }catch(err:any){
    console.error('Failed to get ads metrics', err)
    return res.status(500).json({ message: 'Failed to get metrics' })
  }
})

export default router
