---
*** Begin Patch
*** Update File: frontend/src/pages/Admin/Episodes.tsx
@@
-import React, { useEffect, useState } from 'react'
+import React, { useEffect, useState } from 'react'
 import { useNavigate, useParams } from 'react-router-dom'
 import { getAnimeEpisodes, createEpisode, updateEpisode } from '../../services/admin'
 import { getSignedUpload } from '../../services/auth'
+import ProgressBar from '../../components/ProgressBar'
@@
-  return (
+  return (
     <div>
@@
-      <div className="glass p-4 max-w-xl mb-4">
+      <div className="glass p-4 max-w-xl mb-4">
         <div className="mb-2">Create Episode</div>
@@
-        <div>
-          <button onClick={onCreate} className="px-3 py-2 bg-accent rounded text-black">Create Episode</button>
-        </div>
+        <div>
+          <button onClick={onCreate} disabled={progress>0 && progress<100} className="px-3 py-2 bg-accent rounded text-black">{progress>0 && progress<100 ? `Uploading (${progress}%)` : 'Create Episode'}</button>
+        </div>
+        {progress>0 && (
+          <div className="mt-2"><ProgressBar value={progress} /></div>
+        )}
       </div>
@@
-            <div>
-              <button onClick={()=>onUploadToEpisode(ep.id)} className="px-3 py-1 bg-gray-800 rounded">Upload file to this episode</button>
-            </div>
+            <div>
+              <button onClick={()=>onUploadToEpisode(ep.id)} disabled={progress>0 && progress<100} className="px-3 py-1 bg-gray-800 rounded">{progress>0 && progress<100 ? `Uploading (${progress}%)` : 'Upload file to this episode'}</button>
+            </div>
           </div>
         ))}
       </div>
     </div>
   )
 }
*** End Patch
