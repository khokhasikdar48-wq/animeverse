import { Router } from 'express'
import { prisma } from '../prismaClient'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { hashPassword, comparePassword } from '../utils/password'
import authMiddleware from '../middleware/auth'
import adminMiddleware from '../middleware/admin'
import crypto from 'crypto'

const router = Router()

// Generate invite (admin only) - returns token (in prod send via email)
router.post('/invite', authMiddleware, adminMiddleware, async (req,res)=>{
  const { email } = req.body
  if(!email) return res.status(400).json({message:'email required'})
  let user = await prisma.user.findUnique({where:{email}})
  if(!user){
    user = await prisma.user.create({data:{email, isAdmin:false}})
  }
  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 7*24*60*60*1000) // 7 days
  await prisma.invite.create({data:{userId:user.id, token, expiresAt}})
  // In production email the token. For scaffold return it in the response.
  return res.json({inviteToken: token})
})

// Accept invite - set password
router.post('/invite/accept', async (req,res)=>{
  const { token, password, name } = req.body
  if(!token || !password) return res.status(400).json({message:'token and password required'})
  const invite = await prisma.invite.findUnique({where:{token}, include:{user:true}})
  if(!invite) return res.status(400).json({message:'Invalid invite token'})
  if(invite.used) return res.status(400).json({message:'Invite already used'})
  if(invite.expiresAt < new Date()) return res.status(400).json({message:'Invite expired'})
  const passwordHash = await hashPassword(password)
  await prisma.user.update({where:{id:invite.userId}, data:{passwordHash, name}})
  await prisma.invite.update({where:{id:invite.id}, data:{used:true}})
  return res.json({message:'Password set. You can now login.'})
})

// Login
router.post('/login', async (req,res)=>{
  const { email, password } = req.body
  if(!email || !password) return res.status(400).json({message:'email and password required'})
  const user = await prisma.user.findUnique({where:{email}})
  if(!user || !user.passwordHash) return res.status(401).json({message:'Invalid credentials'})
  const valid = await comparePassword(password, user.passwordHash)
  if(!valid) return res.status(401).json({message:'Invalid credentials'})
  const accessToken = signAccessToken({userId: user.id, isAdmin: user.isAdmin})
  const refreshToken = signRefreshToken({userId: user.id})
  // store refresh token (insecure plain for scaffold) - production: hash
  await prisma.user.update({where:{id:user.id}, data:{refreshToken}})
  // set httpOnly cookie
  res.cookie('refreshToken', refreshToken, {httpOnly:true, secure: process.env.NODE_ENV==='production', sameSite:'lax', maxAge:30*24*60*60*1000})
  return res.json({accessToken, user:{id:user.id, email:user.email, name:user.name, isAdmin:user.isAdmin}})
})

// Refresh
router.post('/refresh', async (req,res)=>{
  const token = req.cookies?.refreshToken
  if(!token) return res.status(401).json({message:'No refresh token'})
  let payload: any
  try{
    payload = verifyRefreshToken(token) as any
  }catch(err){
    return res.status(401).json({message:'Invalid or expired refresh token'})
  }
  const user = await prisma.user.findUnique({where:{id:payload.userId}})
  if(!user || user.refreshToken !== token) return res.status(401).json({message:'Invalid refresh token'})
  const accessToken = signAccessToken({userId: user.id, isAdmin: user.isAdmin})
  const refreshToken = signRefreshToken({userId:user.id})
  await prisma.user.update({where:{id:user.id}, data:{refreshToken}})
  res.cookie('refreshToken', refreshToken, {httpOnly:true, secure: process.env.NODE_ENV==='production', sameSite:'lax', maxAge:30*24*60*60*1000})
  return res.json({accessToken})
})

// Logout
router.post('/logout', authMiddleware, async (req,res)=>{
  const userId = req.user.id
  await prisma.user.update({where:{id:userId}, data:{refreshToken:null}})
  res.clearCookie('refreshToken')
  return res.json({message:'Logged out'})
})

// Me
router.get('/me', authMiddleware, async (req,res)=>{
  const user = await prisma.user.findUnique({where:{id:req.user.id}, select:{id:true,email:true,name:true,isAdmin:true}})
  return res.json({user})
})

export default router
