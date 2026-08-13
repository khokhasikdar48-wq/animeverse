---
*** Begin Patch
*** Update File: backend/src/worker/transcodeWorker.ts
@@
 import { prisma } from '../prismaClient'
 import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
 import { pipeline } from 'stream'
 import { promisify } from 'util'
+import { writeJobLog, sendWebhookNotification, sendEmailNotification } from '../utils/notify'
+import { getCloudFrontUrl } from '../utils/cloudfront'
@@
 const worker = new Worker('transcode', async (job: Job) => {
   console.log('Worker processing job', job.id, job.name, job.data)
   const { key, localPath, targetType, targetId } = job.data
+  const jobId = String(job.id)
+  writeJobLog(jobId, `Job started: ${new Date().toISOString()} data=${JSON.stringify(job.data)}`)
@@
     // Update DB with publicUrl
     try{
       await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: publicUrl }})
     }catch(e){ console.error('Failed to update episode.videoUrl', e) }
 
-    console.log('Transcode job completed, publicUrl=', publicUrl)
+    console.log('Transcode job completed, publicUrl=', publicUrl)
+    writeJobLog(jobId, `Transcode completed: ${publicUrl}`)
+    await sendWebhookNotification('job:completed', { jobId, targetId, publicUrl })
+    await sendEmailNotification('Transcode completed', `Job ${jobId} completed for episode ${targetId}. URL: ${publicUrl}`)
 
   }catch(err:any){
-    console.error('Transcode job failed', err)
-    throw err
+    console.error('Transcode job failed', err)
+    writeJobLog(jobId, `Transcode failed: ${err?.message || err}`)
+    await sendWebhookNotification('job:failed', { jobId, targetId, reason: err?.message })
+    await sendEmailNotification('Transcode failed', `Job ${jobId} failed for episode ${targetId}. Error: ${err?.message}`)
+    throw err
   }finally{
     // cleanup workDir
     try{ fs.rmSync(path.join(uploadsDir, 'work'), { recursive:true, force:true }) }catch(e){}
   }
*** End Patch
