---
*** Begin Patch
*** Update File: backend/src/routes/uploads.ts
@@
-import { generateSignedUpload } from '../utils/s3'
+import { generateSignedUpload } from '../utils/s3'
+import { transcodeQueue } from '../queues/transcodeQueue'
@@
-// Notify/ingest endpoint: client or S3 event can call this after a successful upload to trigger ingestion/transcoding.
-// Expected body: { key: string, targetType: 'episode_video'|'anime_asset', targetId?: string }
-router.post('/notify', authMiddleware, adminMiddleware, async (req,res)=>{
-  const { key, targetType, targetId } = req.body
-  if(!key) return res.status(400).json({ message: 'key required' })
-
-  // In production, enqueue a job to transcode the uploaded file (key) to HLS renditions, upload HLS to S3,
-  // then set episode.videoUrl to the CloudFront HLS playlist URL (e.g., https://<cloudfront>/<hls_path>/master.m3u8).
-  // Here we'll simulate the pipeline: if CLOUDFRONT_DOMAIN set, construct a URL pointing to the uploaded key (no transcoding).
-
-  const cloudfront = process.env.CLOUDFRONT_DOMAIN
-  const region = process.env.AWS_REGION
-  const bucket = process.env.AWS_S3_BUCKET
-  let fileUrl = ''
-  if(cloudfront){
-    fileUrl = `https://${cloudfront}/${key}`
-  }else if(bucket && region){
-    fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
-  }else{
-    // Not on S3: return ok
-    fileUrl = `/uploads/${path.basename(key)}`
-  }
-
-  // If target is episode, update DB to point to this fileUrl (useful for testing). In production, set to HLS playlist URL after transcoding.
-  try{
-    if(targetType === 'episode_video' && targetId){
-      await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: fileUrl }})
-    }
-  }catch(err){
-    console.error('Failed to set episode url after notify', err)
-  }
-
-  // Return queued status
-  return res.json({ status: 'queued', fileUrl })
-})
+// Notify/ingest endpoint: client or S3 event can call this after a successful upload to trigger ingestion/transcoding.
+// Expected body: { key: string, localPath?: string, targetType: 'episode_video'|'anime_asset', targetId?: string }
+router.post('/notify', authMiddleware, adminMiddleware, async (req,res)=>{
+  const { key, localPath, targetType, targetId } = req.body
+  if(!key && !localPath) return res.status(400).json({ message: 'key or localPath required' })
+
+  try{
+    // Enqueue transcode job. Worker will do different things depending on S3 vs local dev.
+    await transcodeQueue.add('transcode-job', { key, localPath, targetType, targetId })
+    return res.json({ status: 'queued' })
+  }catch(err:any){
+    console.error('Failed to enqueue transcode job', err)
+    return res.status(500).json({ message: 'Failed to enqueue job' })
+  }
+})
*** End Patch
