// Prisma schema additions for ad unlocks and nonces
// Add the following models to your prisma/schema.prisma and run `npx prisma migrate dev`:

/*
model AdUnlock {
  id        String   @id @default(cuid())
  userId    String
  episodeId String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([episodeId])
}

model AdUnlockNonce {
  id        String   @id @default(cuid())
  userId    String
  episodeId String
  nonce     String   @unique
  createdAt DateTime @default(now())
}
*/
