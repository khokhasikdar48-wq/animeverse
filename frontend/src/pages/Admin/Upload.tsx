---
*** Begin Patch
*** Update File: frontend/src/pages/Admin/Upload.tsx
@@
-import React, { useState } from 'react'
-import UploadQueue from '../../components/UploadQueue'
-
-export default function AdminUpload(){
-  const [targetId, setTargetId] = useState<string>('')
-
-  return (
-    <div>
-      <h2 className="text-xl font-bold mb-3">Upload Video</h2>
-      <div className="mb-3">
-        <label className="block text-sm">Target Episode ID (paste episode id to associate upload)</label>
-        <input className="p-2 border w-full mt-1" value={targetId} onChange={e=>setTargetId(e.target.value)} placeholder="episode id (optional)" />
-      </div>
-      <UploadQueue targetType="episode_video" targetId={targetId} />
-    </div>
-  )
-}
+import React, { useState } from 'react'
+import UploadQueue from '../../components/UploadQueue'
+import EpisodePicker from '../../components/EpisodePicker'
+
+export default function AdminUpload(){
+  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null)
+
+  return (
+    <div>
+      <h2 className="text-xl font-bold mb-3">Upload Video</h2>
+      <EpisodePicker value={selectedEpisode} onChange={setSelectedEpisode} />
+      <UploadQueue targetType="episode_video" targetId={selectedEpisode || ''} />
+    </div>
+  )
+}
*** End Patch
