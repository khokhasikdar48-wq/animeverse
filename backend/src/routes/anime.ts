import { Router } from 'express'
const router = Router()

router.get('/', (req,res)=>{
  res.json({data:[], message:'List anime (filters not implemented in scaffold)'})
})

router.get('/:slug', (req,res)=>{
  const { slug } = req.params
  res.json({slug, title: slug, description:'Demo anime details.'})
})

export default router
