import { Request, Response, NextFunction } from 'express'

export default function admin(req: Request, res: Response, next: NextFunction){
  if(!req.user) return res.status(401).json({message:'Unauthorized'})
  if(!req.user.isAdmin) return res.status(403).json({message:'Admin access required'})
  next()
}
