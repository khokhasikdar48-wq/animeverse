import { Router } from 'express'
import { prisma } from '../prismaClient'

const router = Router()

router.get('/', async (req,res)=>{
  const list = await prisma.anime.findMany({ include:{ genres:true }, orderBy:{ createdAt: 'desc' }})
  return res.json({ data: list })
})

router.get('/:slug', async (req,res)=>{
  const { slug } = req.params
  const anime = await prisma.anime.findUnique({ where:{ slug }, include:{ episodes: { orderBy:{ episodeNumber: 'asc' } }, genres:true }})
  if(!anime) return res.status(404).json({ message:'Not found' })
  return res.json(anime)
})

export default router
