import express from 'express'
import { prisma } from '../prismaClient'
import authMiddleware from '../middleware/auth'
import { transcodeQueue } from '../queues/transcodeQueue'
import { S3Client, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'

const router = express.Router()

// POST /api/admin/uploads/notify
// Body: { key, targetType, targetId, metadata }
router.post('/notify', authMiddleware, async (req, res) => {
  const { key, targetType, targetId, metadata } = req.body
  if (!key) return res.status(400).json({ message: 'key required' })

  try {
    // If metadata provided and target is an episode, update episode metadata
    if (targetType === 'episode_video' && targetId && metadata) {
      const updateData: any = {}
      if (metadata.title) updateData.title = metadata.title
      if (metadata.description) updateData.description = metadata.description
      try {
        await prisma.episode.update({ where: { id: targetId }, data: updateData })
      } catch (e) {
        console.warn('Failed to update episode metadata', e)
      }
    }

    // Enqueue transcode job (worker consumes this queue)
    try {
      await transcodeQueue.add('transcode', { key, targetType, targetId, metadata })
    } catch (e) {
      console.warn('Failed to enqueue transcode job', e)
    }

    return res.json({ ok: true })
  } catch (err: any) {
    console.error('notify failed', err)
    return res.status(500).json({ message: 'notify failed' })
  }
})

// POST /api/admin/uploads/abort-multipart
// Body: { bucket, key, uploadId }
router.post('/abort-multipart', authMiddleware, async (req, res) => {
  const { bucket, key, uploadId } = req.body
  if (!bucket || !key || !uploadId) return res.status(400).json({ message: 'bucket,key,uploadId required' })

  const region = process.env.AWS_REGION
  const accessKey = process.env.AWS_ACCESS_KEY_ID
  const secret = process.env.AWS_SECRET_ACCESS_KEY
  if (!region || !accessKey || !secret) return res.status(501).json({ message: 'S3 not configured' })

  try {
    const client = new S3Client({ region, credentials: { accessKeyId: accessKey, secretAccessKey: secret } })
    const cmd = new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId })
    await client.send(cmd)
    return res.json({ ok: true })
  } catch (err: any) {
    console.error('abort multipart failed', err)
    return res.status(500).json({ message: 'abort multipart failed', error: err?.message })
  }
})

export default router
