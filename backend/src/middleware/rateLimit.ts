import { Request, Response, NextFunction } from 'express'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

type RateLimitOptions = {
  windowSeconds: number
  limit: number
  keyPrefix?: string
}

export function requestRateLimit(opts: RateLimitOptions){
  const prefix = opts.keyPrefix || 'rate:req'
  return async function(req: Request, res: Response, next: NextFunction){
    try{
      const user = (req as any).user
      const id = user?.id || req.ip
      const key = `${prefix}:${id}`
      const current = await redis.incr(key)
      if(current === 1){
        await redis.expire(key, opts.windowSeconds)
      }
      if(current > opts.limit){
        return res.status(429).json({ message: 'Too many requests, slow down' })
      }
    }catch(e){
      console.warn('Rate limit check failed', e)
      // Fail-open on errors
    }
    return next()
  }
}

// Unlock quota limiter uses DB count to avoid accidental double-counting
import { prisma } from '../prismaClient'

export function unlockQuotaLimit(maxUnlocks:number, windowSeconds:number){
  return async function(req: Request, res: Response, next: NextFunction){
    try{
      const user = (req as any).user
      if(!user) return res.status(401).json({ message: 'auth required' })
      const since = new Date(Date.now() - windowSeconds * 1000)
      const count = await prisma.adUnlock.count({ where: { userId: user.id, createdAt: { gte: since } } })
      if(count >= maxUnlocks) return res.status(429).json({ message: 'Unlock quota exceeded' })
    }catch(e){
      console.warn('Unlock quota check failed', e)
    }
    return next()
  }
}
