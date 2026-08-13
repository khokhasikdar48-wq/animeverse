import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main(){
  const email = process.argv[2] || 'demo@animeverse.local'
  let user = await prisma.user.findUnique({ where: { email } })
  if(!user) user = await prisma.user.create({ data: { email } })

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const invite = await prisma.invite.create({ data: { userId: user.id, token, expiresAt } })
  console.log('Invite token for', email, ':', invite.token)
}

main().catch(e=>{ console.error(e); process.exit(1) })
