import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import path from 'path'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { prisma } from '../prismaClient'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

const worker = new Worker('transcode', async (job: Job) => {
  console.log('Worker processing job', job.id, job.name, job.data)
  const { key, localPath, targetType, targetId } = job.data

  // If localPath provided (mock dev), transcode local file to HLS and store under uploads/hls/{targetId}
  if(localPath && targetType === 'episode_video' && targetId){
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
    const src = localPath.startsWith('/') ? path.join(uploadsDir, path.basename(localPath)) : localPath
    const outDir = path.join(uploadsDir, 'hls', targetId)
    fs.mkdirSync(outDir, { recursive: true })
    const masterPlaylist = path.join(outDir, 'master.m3u8')

    // Generate HLS at 3 bitrates for demo (480,720,1080)
    return new Promise<void>((resolve, reject)=>{
      ffmpeg(src)
        .addOption('-preset', 'veryfast')
        .addOption('-g', '48')
        .output(path.join(outDir, 'index_480.m3u8'))
        .videoCodec('libx264')
        .size('?x480')
        .audioCodec('aac')
        .outputOptions(['-hls_time 4','-hls_playlist_type vod'])
        .on('error', (err)=>{
          console.error('FFmpeg error', err)
          reject(err)
        })
        .on('end', async ()=>{
          // Simplified: create a master playlist referencing the single rendition
          const master = `#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:0,\nindex_480.m3u8\n`
          fs.writeFileSync(masterPlaylist, master)
          // Update episode.videoUrl to local HLS path
          const publicUrl = `/uploads/hls/${targetId}/master.m3u8`
          try{
            await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: publicUrl }})
          }catch(e){ console.error('DB update failed', e) }
          resolve()
        })
        .run()
    })
  }

  // If S3 key provided, in production we would download the file, transcode, upload HLS to S3, and set episode.videoUrl to CloudFront URL
  if(key && targetType === 'episode_video' && targetId){
    const region = process.env.AWS_REGION
    const bucket = process.env.AWS_S3_BUCKET
    const cloudfront = process.env.CLOUDFRONT_DOMAIN
    if(!region || !bucket){
      console.warn('S3 not configured, cannot transcode s3 key')
      return
    }

    // For simplicity, we'll skip actual S3 download in this scaffold and just set the episode.videoUrl to the S3 object URL or CloudFront URL
    const fileUrl = cloudfront ? `https://${cloudfront}/${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    try{
      await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: fileUrl }})
    }catch(e){ console.error('DB update failed', e) }
    return
  }

  console.log('Job processed (no action taken)')
}, { connection })

worker.on('completed', (job)=> console.log('Job completed', job.id))
worker.on('failed', (job, err)=> console.error('Job failed', job?.id, err))

console.log('Transcode worker started')
