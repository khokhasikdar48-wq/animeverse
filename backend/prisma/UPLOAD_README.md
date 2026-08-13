# Prisma model for Uploads

Add this model to your `prisma/schema.prisma` and run `npx prisma migrate dev --name add_uploads` and `npx prisma generate`.

```prisma
model Upload {
  id             String   @id @default(cuid())
  userId         String
  episodeId      String?  // optional: upload may be associated with an episode
  key            String   // S3 key or server-side path
  bucket         String?  // optional
  uploadId       String?  // multipart UploadId (for abort)
  targetType     String   // example: "episode_video"
  status         String   @default("pending") // pending, processing, completed, failed
  metadataJson   String?  // optional JSON string of per-upload metadata (title/description)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
  @@index([episodeId])
  @@index([key])
}
```

Notes:
- After adding the model, run:
  - `npx prisma generate`
  - `npx prisma migrate dev --name add_uploads`

- This creates an Upload table that we will use to persist per-upload metadata and to link transcode jobs to a specific upload record for auditability.
