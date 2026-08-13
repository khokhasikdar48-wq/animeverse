---
*** Begin Patch
*** Update File: backend/src/routes/jobs.ts
@@
 router.get('/:id', async (req,res)=>{
   const id = req.params.id
@@
 })
 
+// Return job logs (if available)
+router.get('/:id/logs', async (req,res)=>{
+  const id = req.params.id
+  try{
+    const logsDir = path.join(__dirname, '..', '..', 'uploads', 'logs')
+    const file = path.join(logsDir, `${id}.log`)
+    if(!fs.existsSync(file)) return res.status(404).json({ message: 'Logs not found' })
+    const content = fs.readFileSync(file,'utf8')
+    return res.type('text/plain').send(content)
+  }catch(err:any){
+    console.error('Failed to read job logs', err)
+    return res.status(500).json({ message: 'Failed to read logs' })
+  }
+})
+
+// Retry a job by re-adding it to the queue
 router.post('/:id/retry', async (req,res)=>{
*** End Patch
