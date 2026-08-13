*** Begin Patch
*** Update File: backend/src/routes/uploads.ts
@@
 router.post('/notify', authMiddleware, adminMiddleware, async (req,res)=>{
   const { key, localPath, targetType, targetId } = req.body
   if(!key && !localPath) return res.status(400).json({ message: 'key or localPath required' })
 
   try{
-    // Enqueue transcode job. Worker will do different things depending on S3 vs local dev.
-    await transcodeQueue.add('transcode-job', { key, localPath, targetType, targetId })
+    // Enqueue transcode job with retry/backoff and limited attempts.
+    await transcodeQueue.add('transcode-job', { key, localPath, targetType, targetId }, {
+      attempts: 3,
+      backoff: { type: 'exponential', delay: 60 * 1000 }, // 1m initial
+      removeOnComplete: 100,
+      removeOnFail: 1000
+    })
     return res.json({ status: 'queued' })
   }catch(err:any){
     console.error('Failed to enqueue transcode job', err)
     return res.status(500).json({ message: 'Failed to enqueue job' })
   }
 })
+
+// Resumable upload endpoints (simple chunked uploader)
+// POST /api/admin/uploads/init -> { uploadId }
+router.post('/init', authMiddleware, adminMiddleware, async (req,res)=>{
+  const { filename, totalSize } = req.body
+  if(!filename || !totalSize) return res.status(400).json({ message: 'filename and totalSize required' })
+  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
+  const tmpDir = path.join(uploadsDir, 'resumable', uploadId)
+  fs.mkdirSync(tmpDir, { recursive: true })
+  // store meta
+  fs.writeFileSync(path.join(tmpDir, 'meta.json'), JSON.stringify({ filename, totalSize }))
+  return res.json({ uploadId })
+})
+
+// PUT chunk: /api/admin/uploads/chunk/:uploadId?index=0
+router.put('/chunk/:uploadId', authMiddleware, adminMiddleware, upload.single('chunk'), async (req,res)=>{
+  const { uploadId } = req.params
+  const index = req.query.index ?? '0'
+  const tmpDir = path.join(uploadsDir, 'resumable', uploadId)
+  if(!fs.existsSync(tmpDir)) return res.status(404).json({ message: 'uploadId not found' })
+  if(!req.file) return res.status(400).json({ message: 'chunk required' })
+  const dest = path.join(tmpDir, `${index}.part`)
+  fs.renameSync(req.file.path, dest)
+  return res.json({ ok:true })
+})
+
+// POST complete: assembles chunks into a single file and behaves like mock upload
+router.post('/complete', authMiddleware, adminMiddleware, async (req,res)=>{
+  const { uploadId, targetType, targetId } = req.body
+  const tmpDir = path.join(uploadsDir, 'resumable', uploadId)
+  if(!fs.existsSync(tmpDir)) return res.status(404).json({ message: 'uploadId not found' })
+  const metaPath = path.join(tmpDir, 'meta.json')
+  if(!fs.existsSync(metaPath)) return res.status(400).json({ message: 'meta missing' })
+  const meta = JSON.parse(fs.readFileSync(metaPath,'utf8'))
+  const files = fs.readdirSync(tmpDir).filter(f=>f.endsWith('.part')).sort((a,b)=>{ return Number(a.split('.')[0]) - Number(b.split('.')[0]) })
+  const finalName = `${Date.now()}-${meta.filename.replace(/[^a-zA-Z0-9.-]/g,'_')}`
+  const finalPath = path.join(uploadsDir, finalName)
+  const writeStream = fs.createWriteStream(finalPath)
+  for(const f of files){
+    const chunkPath = path.join(tmpDir, f)
+    const buf = fs.readFileSync(chunkPath)
+    writeStream.write(buf)
+  }
+  writeStream.end()
+  // cleanup chunks
+  fs.rmSync(tmpDir, { recursive:true, force:true })
+
+  // now process finalPath similarly to mock endpoint: validate and link
+  const stats = fs.statSync(finalPath)
+  const sizeMB = stats.size / (1024*1024)
+  // simple mime guess by extension
+  const mime = require('mime-types').lookup(finalPath) || ''
+  let allowedMB = MAX_IMAGE_MB
+  if(mime.startsWith('video/') || targetType === 'episode_video') allowedMB = MAX_VIDEO_MB
+  if(sizeMB > allowedMB){ fs.unlinkSync(finalPath); return res.status(413).json({ message: `File too large. Max ${allowedMB} MB` }) }
+
+  const fileUrl = `/uploads/${path.basename(finalPath)}`
+  try{
+    if(targetType && targetId){
+      if(targetType === 'anime_poster'){
+        await prisma.anime.update({ where:{ id: targetId }, data:{ posterUrl: fileUrl }})
+      }else if(targetType === 'anime_cover'){
+        await prisma.anime.update({ where:{ id: targetId }, data:{ coverUrl: fileUrl }})
+      }else if(targetType === 'episode_video'){
+        await prisma.episode.update({ where:{ id: targetId }, data:{ videoUrl: fileUrl }})
+      }
+    }
+  }catch(err){ console.error('Linking upload failed', err) }
+
+  // enqueue transcode job using localPath
+  try{ await transcodeQueue.add('transcode-job', { localPath: fileUrl, targetType, targetId }, { attempts:3, backoff:{type:'exponential', delay:60000} }) }catch(e){console.error('enqueue failed', e)}
+
+  return res.json({ fileUrl })
+})
*** End Patch
