import { Router } from 'express'
const router = Router()

router.get('/', (req,res)=> res.json({items:[]}))

export default router
