import { Router } from 'express'
import { prisma } from '../prismaClient'

const router = Router()

router.get('/:id', async (req,res)=>{
  const { id } = req.params
  const ep = await prisma.episode.findUnique({ where:{ id }, include:{ anime:true }})
  if(!ep) return res.status(404).json({ message:'Episode not found' })
  return res.json(ep)
})

export default router
