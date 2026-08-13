import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { prisma } from '../prismaClient'

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export default async function auth(req: Request, res: Response, next: NextFunction){
  const authHeader = req.headers.authorization
  if(!authHeader) return res.status(401).json({message:'Authorization header missing'})
  const parts = authHeader.split(' ')
  if(parts.length !== 2) return res.status(401).json({message:'Invalid authorization header'})
  const token = parts[1]
  try{
    const payload = verifyAccessToken(token) as any
    if(!payload?.userId) return res.status(401).json({message:'Invalid token payload'})
    const user = await prisma.user.findUnique({where:{id: payload.userId}})
    if(!user) return res.status(401).json({message:'User not found'})
    req.user = user
    next()
  }catch(err){
    return res.status(401).json({message:'Invalid or expired token'})
  }
}
