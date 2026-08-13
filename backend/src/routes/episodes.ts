import { Router } from 'express'
const router = Router()

router.get('/:id', (req,res)=>{
  res.json({id:req.params.id, title:'Episode demo'})
})

export default router
