---
*** Begin Patch
*** Update File: frontend/src/pages/Admin/Episodes.tsx
@@
-  const onCreate = async ()=>{
-    if(!title||!epNum) return alert('title and episode number required')
-    const ep = await createEpisode(id as string, { title, episodeNumber: Number(epNum), description:'' })
-    // if file selected, upload and link
-    if(file){
-      const signed = await getSignedUpload(file.name)
-      const form = new FormData()
-      form.append('file', file)
-      form.append('targetType','episode_video')
-      form.append('targetId', ep.id)
-      await fetch(signed.uploadUrl, { method: signed.method||'POST', body: form, credentials: 'include' })
-    }
-    const eps = await getAnimeEpisodes(id as string)
-    setEpisodes(eps)
-    setTitle(''); setEpNum(''); setFile(null)
-  }
+  const [progress, setProgress] = useState<number>(0)
+
+  const uploadWithProgress = (uploadUrl:string, form:FormData, onProgress:(p:number)=>void) => {
+    return new Promise<any>((resolve,reject)=>{
+      const xhr = new XMLHttpRequest()
+      const fullUrl = uploadUrl.startsWith('/') ? `${window.location.origin}${uploadUrl}` : uploadUrl
+      xhr.open('POST', fullUrl)
+      xhr.withCredentials = true
+      xhr.upload.onprogress = (e)=>{
+        if(e.lengthComputable){
+          const pct = Math.round((e.loaded / e.total) * 100)
+          onProgress(pct)
+        }
+      }
+      xhr.onload = ()=>{
+        if(xhr.status >=200 && xhr.status < 300){
+          try{ resolve(JSON.parse(xhr.responseText)) }catch(err){ resolve({}) }
+        }else{
+          reject(new Error(xhr.responseText || 'Upload failed'))
+        }
+      }
+      xhr.onerror = ()=> reject(new Error('Upload error'))
+      xhr.send(form)
+    })
+  }
+
+  const validateFile = (f:File|null, expectedType:'video'|'image'|'any') => {
+    if(!f) return 'No file selected'
+    const maxVideoMB = Number(import.meta.env.VITE_MAX_VIDEO_MB || '1024')
+    const maxImageMB = Number(import.meta.env.VITE_MAX_IMAGE_MB || '10')
+    const sizeMB = f.size / (1024*1024)
+    if(expectedType==='video'){
+      if(!f.type.startsWith('video/')) return 'File must be a video'
+      if(sizeMB > maxVideoMB) return `Video too large (max ${maxVideoMB} MB)`
+    }
+    if(expectedType==='image'){
+      if(!f.type.startsWith('image/')) return 'File must be an image'
+      if(sizeMB > maxImageMB) return `Image too large (max ${maxImageMB} MB)`
+    }
+    return null
+  }
+
+  const onCreate = async ()=>{
+    if(!title||!epNum) return alert('title and episode number required')
+    const ep = await createEpisode(id as string, { title, episodeNumber: Number(epNum), description:'' })
+    // if file selected, upload and link
+    if(file){
+      const validationError = validateFile(file,'video')
+      if(validationError) return alert(validationError)
+      const signed = await getSignedUpload(file.name, 'episode_video', ep.id)
+      const form = new FormData()
+      form.append('file', file)
+      form.append('targetType','episode_video')
+      form.append('targetId', ep.id)
+      setProgress(0)
+      try{
+        await uploadWithProgress(signed.uploadUrl, form, (p)=>setProgress(p))
+      }catch(err:any){
+        alert(err?.message || 'Upload failed')
+      }
+    }
+    const eps = await getAnimeEpisodes(id as string)
+    setEpisodes(eps)
+    setTitle(''); setEpNum(''); setFile(null); setProgress(0)
+  }
@@
-  const onUploadToEpisode = async (episodeId:string)=>{
-    if(!file) return alert('select a file first')
-    const signed = await getSignedUpload(file.name)
-    const form = new FormData()
-    form.append('file', file)
-    form.append('targetType','episode_video')
-    form.append('targetId', episodeId)
-    const res = await fetch(signed.uploadUrl, { method: signed.method||'POST', body: form, credentials: 'include' })
-    const data = await res.json()
-    alert('Uploaded: '+data.fileUrl)
-    const eps = await getAnimeEpisodes(id as string)
-    setEpisodes(eps)
-  }
+  const onUploadToEpisode = async (episodeId:string)=>{
+    if(!file) return alert('select a file first')
+    const validationError = validateFile(file,'video')
+    if(validationError) return alert(validationError)
+    const signed = await getSignedUpload(file.name, 'episode_video', episodeId)
+    const form = new FormData()
+    form.append('file', file)
+    form.append('targetType','episode_video')
+    form.append('targetId', episodeId)
+    setProgress(0)
+    try{
+      await uploadWithProgress(signed.uploadUrl, form, (p)=>setProgress(p))
+      alert('Upload complete')
+    }catch(err:any){
+      alert(err?.message || 'Upload failed')
+    }
+    const eps = await getAnimeEpisodes(id as string)
+    setEpisodes(eps)
+    setProgress(0)
+  }
*** End Patch
