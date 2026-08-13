import jwt from 'jsonwebtoken'

const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret'
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret'
const accessExpires = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
const refreshExpires = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'

export function signAccessToken(payload: object){
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpires })
}

export function signRefreshToken(payload: object){
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires })
}

export function verifyAccessToken(token: string){
  return jwt.verify(token, accessSecret)
}

export function verifyRefreshToken(token: string){
  return jwt.verify(token, refreshSecret)
}
