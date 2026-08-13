import { Queue, QueueScheduler } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
export const transcodeQueue = new Queue('transcode', { connection })
// QueueScheduler ensures stalled jobs are retried and delayed jobs are processed
export const transcodeQueueScheduler = new QueueScheduler('transcode', { connection })
