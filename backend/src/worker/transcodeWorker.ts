import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import path from 'path'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { prisma } from '../prismaClient'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { pipeline } from 'stream'
import { promisify } from 'util'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)
const pipe = promisify(pipeline)

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

const s3Client = (process.env.AWS_REGION && process.env.AWS_S3_BUCKET) ? new S3Client({ region: process.env.AWS_REGION }) : null

const worker = new Worker('transcode', async (job: Job) => {
  console.log('Worker processing job', job.id, job.name, job.data)
  const { key, localPath, targetType, targetId } = job.data

  // only handle episode video transcodes here
  if(targetType !== 'episode_video' || !targetId) {
    console.log('Job not for episode video or missing targetId; skipping')
    return
  }

  const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
  fs.mkdirSync(uploadsDir, { recursive: true })

  // Create a temporary working directory per job
  const workDir = path.join(uploadsDir, 'work', `${targetId}-${Date.now()}`)
  fs.mkdirSync(workDir, { recursive: true })

  try{
    let sourcePath = ''

    if(localPath){
      // localPath expected like /uploads/filename
      sourcePath = path.join(uploadsDir, path.basename(localPath))
      if(!fs.existsSync(sourcePath)){
        throw new Error('Local source not found: '+sourcePath)
      }
    }else if(key && s3Client){
      // download from s3 to a temp path
      const tmpFile = path.join(workDir, path.basename(key))
      console.log('Downloading s3 key to', tmpFile)
      const getCmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
      const resp = await s3Client.send(getCmd)
      if(!resp.Body) throw new Error('S3 object has no body')
      const bodyStream = resp.Body as any
      await pipe(bodyStream, fs.createWriteStream(tmpFile))
      sourcePath = tmpFile
    }else{
      throw new Error('No source available for transcode')
    }

    // Prepare output directory for HLS
    const outDir = path.join(uploadsDir, 'hls', targetId)
    fs.mkdirSync(outDir, { recursive: true })

    // transcode to two renditions (720p and 480p) and produce HLS playlists
    // We'll produce index_720.m3u8 and index_480.m3u8 and a master.m3u8 referencing them

    const renditions = [
      { name: '720', size: '?x720', bitrate: '2000k', filename: 'index_720.m3u8' },
      { name: '480', size: '?x480', bitrate: '800k', filename: 'index_480.m3u8' }
    ]

    // Run ffmpeg sequentially for each rendition to keep memory low
    for(const r of renditions){
      await new Promise<void>((resolve, reject)=>{
        ffmpeg(sourcePath)
          .videoCodec('libx264')
          .size(r.size)
          .videoBitrate(r.bitrate)
          .audioCodec('aac')
          .outputOptions([
            '-hls_time 6',
            '-hls_playlist_type vod',
            '-hls_segment_filename', path.join(outDir, `${r.name}_%03d.ts`)
          ])
          .output(path.join(outDir, r.filename))
          .on('error', (err)=>{
            console.error('FFmpeg error for', r.name, err)
            reject(err)
          })
          .on('end', ()=>{
            console.log('FFmpeg finished rendition', r.name)
            resolve()
          })
          .run()
      })
    }

    // Create simple master playlist referencing renditions
    const masterPlaylist = renditions.map(r=>`#EXT-X-STREAM-INF:BANDWIDTH=${r.bitrate.replace(/k/,'000')},RESOLUTION=${r.size.replace('?x','x')}
${r.filename}`).join('\n')
    const masterContent = `#EXTM3U\n#EXT-X-VERSION:3\n${masterPlaylist}\n`
    const masterPath = path.join(outDir, 'master.m3u8')
    fs.writeFileSync(masterPath, masterContent)

    // If S3 configured, upload HLS directory to S3 under a prefix like hls/{targetId}/
    let publicUrl = ''
    if(s3Client && process.env.AWS_S3_BUCKET){
      const bucket = process.env.AWS_S3_BUCKET!
      const prefix = `hls/${targetId}`
      const files = fs.readdirSync(outDir)
      for(const file of files){
        const filePath = path.join(outDir, file)
        const keyName = `${prefix}/${file}`
        const body = fs.createReadStream(filePath)
        const put = new PutObjectCommand({ Bucket: bucket, Key: keyName, Body: body, ContentType: guessContentType(file) })
        await s3Client.send(put)
        console.log('Uploaded to s3:', keyName)
      }
      if(process.env.CLOUDFRONT_DOMAIN){
        publicUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${prefix}/master.m3u8`
      }else{
        publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${prefix}/master.m3u8`
      }
    }else{
      // Use local served path
      publicUrl = `/uploads/hls/${targetId}/master.m3u8`
    }

    // Update DB with publicUrl
    try{
      await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: publicUrl }})
    }catch(e){ console.error('Failed to update episode.videoUrl', e) }

    console.log('Transcode job completed, publicUrl=', publicUrl)

  }catch(err:any){
    console.error('Transcode job failed', err)
    throw err
  }finally{
    // cleanup workDir
    try{ fs.rmSync(path.join(uploadsDir, 'work'), { recursive:true, force:true }) }catch(e){}
  }

}, { connection })

worker.on('completed', (job)=> console.log('Job completed', job.id))
worker.on('failed', (job, err)=> console.error('Job failed', job?.id, err))

console.log('Transcode worker started')

function guessContentType(filename:string){
  const ext = path.extname(filename).toLowerCase()
  if(ext === '.m3u8') return 'application/vnd.apple.mpegurl'
  if(ext === '.ts') return 'video/MP2T'
  if(ext === '.mp4') return 'video/mp4'
  if(ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if(ext === '.png') return 'image/png'
  return 'application/octet-stream'
}
