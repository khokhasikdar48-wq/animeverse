---
*** Begin Patch
*** Update File: frontend/src/pages/Admin/Upload.tsx
@@
-import React, { useState } from 'react'
-import api from '../../services/api'
-import { useNavigate } from 'react-router-dom'
-
-export default function AdminUpload(){
-  const [file,setFile] = useState<File | null>(null)
-  const [progress,setProgress] = useState(0)
-  const nav = useNavigate()
-
-  async function onUpload(){
-    if(!file) return alert('Select file')
-    try{
-      // request signed url
-      const signed = await api.post('/admin/uploads/signed-url', { filename: file.name, targetType: 'episode_video', targetId: null })
-      const uploadUrl = signed.data.uploadUrl
-      // If mock path, POST multipart
-      if(uploadUrl.startsWith('/')){
-        const form = new FormData()
-        form.append('file', file)
-        form.append('targetType','episode_video')
-        form.append('targetId','')
-        await api.post(uploadUrl, form, { headers:{ 'Content-Type': 'multipart/form-data' }, onUploadProgress:(e)=>{ setProgress(Math.round((e.loaded/e.total)*100)) } })
-      } else {
-        // PUT to S3
-        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
-      }
-      alert('Upload complete')
-      nav('/admin/jobs')
-    }catch(e:any){ alert(e?.message || 'Upload failed') }
-  }
-
-  return (
-    <div>
-      <h2 className="text-xl font-bold mb-3">Upload Video</h2>
-      <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
-      <div className="mt-3"><button onClick={onUpload} className="px-3 py-2 bg-accent rounded">Upload</button></div>
-      {progress>0 && <div className="mt-2">Progress: {progress}%</div>}
-    </div>
-  )
-}
+import React, { useState } from 'react'
+import UploadQueue from '../../components/UploadQueue'
+
+export default function AdminUpload(){
+  const [targetId, setTargetId] = useState<string>('')
+
+  return (
+    <div>
+      <h2 className="text-xl font-bold mb-3">Upload Video</h2>
+      <div className="mb-3">
+        <label className="block text-sm">Target Episode ID (paste episode id to associate upload)</label>
+        <input className="p-2 border w-full mt-1" value={targetId} onChange={e=>setTargetId(e.target.value)} placeholder="episode id (optional)" />
+      </div>
+      <UploadQueue targetType="episode_video" targetId={targetId} />
+    </div>
+  )
+}
*** End Patch
