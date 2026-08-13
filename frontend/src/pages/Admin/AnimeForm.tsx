---
*** Begin Patch
*** Update File: frontend/src/pages/Admin/AnimeForm.tsx
@@
   const onSave = async ()=>{
     if(!title||!slug) return alert('title and slug required')
     if(id){
       await updateAnime(id, { title, slug, description: desc, year: year?Number(year):undefined })
       alert('Saved')
       nav('/admin/anime')
     }else{
       const anime = await createAnime({ title, slug, description: desc, year: year?Number(year):undefined })
       // if poster uploaded, upload and link
-      if(posterFile){
-        const signed = await getSignedUpload(posterFile.name)
-        // mock uploads expect form-data file + targetType + targetId
-        const form = new FormData()
-        form.append('file', posterFile)
-        form.append('targetType','anime_poster')
-        form.append('targetId', anime.id)
-        await fetch(signed.uploadUrl, { method: 'POST', body: form, credentials: 'include' })
-      }
+      if(posterFile){
+        const maxImageMB = Number(import.meta.env.VITE_MAX_IMAGE_MB || '10')
+        const sizeMB = posterFile.size / (1024*1024)
+        if(sizeMB > maxImageMB) return alert(`Poster too large (max ${maxImageMB} MB)`)
+        const signed = await getSignedUpload(posterFile.name, 'anime_poster', anime.id)
+        const form = new FormData()
+        form.append('file', posterFile)
+        form.append('targetType','anime_poster')
+        form.append('targetId', anime.id)
+        // use XMLHttpRequest to get progress (simple)
+        await new Promise<void>((resolve,reject)=>{
+          const xhr = new XMLHttpRequest()
+          const uploadUrl = signed.uploadUrl.startsWith('/') ? `${window.location.origin}${signed.uploadUrl}` : signed.uploadUrl
+          xhr.open('POST', uploadUrl)
+          xhr.withCredentials = true
+          xhr.onload = ()=> xhr.status>=200 && xhr.status<300 ? resolve() : reject(new Error(xhr.responseText))
+          xhr.onerror = ()=> reject(new Error('Upload failed'))
+          xhr.send(form)
+        })
+      }
       nav('/admin/anime')
     }
   }
*** End Patch
