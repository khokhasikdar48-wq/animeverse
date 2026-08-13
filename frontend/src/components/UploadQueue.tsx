---
*** Begin Patch
*** Update File: frontend/src/components/UploadQueue.tsx
@@
-      // If uploadUrl is a local mock path (starts with /), post multipart to server mock endpoint
-      if(uploadUrl && uploadUrl.startsWith('/')){
+      // Record any returned s3/multipart info on the item for potential aborts
+      setItems(s=>s.map(it=> it.id===item.id ? { ...it, s3info: signedRes.data } : it))
+
+      // If uploadUrl is a local mock path (starts with /), post multipart to server mock endpoint
+      if(uploadUrl && uploadUrl.startsWith('/')){
         const form = new FormData()
         form.append('file', item.file)
         if(item.targetType) form.append('targetType', item.targetType)
         if(item.targetId) form.append('targetId', item.targetId)
         await axios.post(uploadUrl, form, { headers: { 'Content-Type': 'multipart/form-data' }, signal: controller.signal, onUploadProgress: (ev)=>{
           const pct = ev.total ? Math.round((ev.loaded/ev.total)*100) : 0
           setItems(s=>s.map(it=> it.id===item.id ? { ...it, progress: pct } : it))
         }})
       } else {
         // PUT to presigned URL (S3) — use axios to get progress events
         await axios.put(uploadUrl, item.file, { headers: { 'Content-Type': item.file.type || 'application/octet-stream' }, signal: controller.signal, onUploadProgress: (ev)=>{
           const pct = ev.total ? Math.round((ev.loaded/ev.total)*100) : 0
           setItems(s=>s.map(it=> it.id===item.id ? { ...it, progress: pct } : it))
         }})
         // After PUT, client should notify back to server if needed. If signed-url endpoint returned key etc, instruct server to ingest.
-        if(signedRes.data.key){
-          try{ await api.post('/admin/uploads/notify', { key: signedRes.data.key, targetType: item.targetType, targetId: item.targetId }) }catch(e){ console.warn('notify failed', e) }
+        if(signedRes.data.key){
+          try{
+            const payload:any = { key: signedRes.data.key, targetType: item.targetType, targetId: item.targetId }
+            // include metadata if present
+            if((item as any).metaTitle || (item as any).metaDescription){
+              payload.metadata = { title: (item as any).metaTitle, description: (item as any).metaDescription }
+            }
+            await api.post('/admin/uploads/notify', payload)
+          }catch(e){ console.warn('notify failed', e) }
         }
       }
@@
   function cancelUpload(id:string){
-    const ctl = controllers.current[id]
-    if(ctl) ctl.abort()
-    setItems(s=>s.map(it=> it.id===id ? { ...it, status:'canceled', error:'Canceled by user' } : it))
+    const ctl = controllers.current[id]
+    // if the item has multipart info, call server to abort multipart upload
+    const item = items.find(i=>i.id===id)
+    if(item && (item as any).s3info && (item as any).s3info.uploadId){
+      const s3 = (item as any).s3info
+      api.post('/admin/uploads/abort-multipart', { bucket: s3.bucket || s3.Bucket, key: s3.key || s3.Key || s3.objectKey || s3['key'], uploadId: s3.uploadId || s3.UploadId }).catch(e=> console.warn('abort-multipart failed', e))
+    }
+    if(ctl) ctl.abort()
+    setItems(s=>s.map(it=> it.id===id ? { ...it, status:'canceled', error:'Canceled by user' } : it))
   }
*** End Patch
