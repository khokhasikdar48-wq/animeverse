import { Router } from 'express'
const router = Router()

router.get('/', (req,res)=> res.json({message:'admin endpoints placeholder'}))

export default router
