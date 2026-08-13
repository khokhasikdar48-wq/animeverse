---
*** Begin Patch
*** Update File: frontend/src/components/UploadQueue.tsx
@@
 import api from '../services/api'
 import axios from 'axios'
+import EpisodeCreatorModal from './EpisodeCreatorModal'
@@
 export default function UploadQueue({ initial=[] as File[], targetType='episode_video', targetId='' }: { initial?: File[]; targetType?: string; targetId?: string | null }){
@@
   const controllers = useRef<Record<string, AbortController>>({})
+  const [creatorOpenFor, setCreatorOpenFor] = React.useState<string | null>(null)
@@
   function cancelUpload(id:string){
@@
   }
 
   function retryUpload(id:string){
@@
   }
+
+  function openCreatorForItem(id:string){
+    setCreatorOpenFor(id)
+  }
+
+  function closeCreator(){ setCreatorOpenFor(null) }
+
+  async function onEpisodeCreatedForItem(itemId:string, episode:any){
+    // assign the created episode id to the upload item
+    setItems(s=>s.map(it=> it.id===itemId ? { ...it, targetId: episode.id } : it))
+    closeCreator()
+  }
@@
         {items.map(it=> (
           <div key={it.id} className="p-3 bg-white/5 rounded flex items-center justify-between">
             <div className="flex-1">
               <div className="font-semibold">{it.file.name}</div>
-              <div className="text-sm text-gray-400">{it.progress}% — {it.status}{it.error ? ` — ${it.error}`:''}</div>
+              <div className="text-sm text-gray-400">{it.progress}% — {it.status}{it.error ? ` — ${it.error}`:''}</div>
+              <div className="text-xs mt-1 text-gray-300">Target episode: {it.targetId || '(not set)'}</div>
+              <div className="mt-2">
+                <input placeholder="Per-upload title (optional)" className="p-1 text-sm border w-full" value={(it as any).metaTitle||''} onChange={e=> setItems(s=>s.map(x=> x.id===it.id ? { ...x, metaTitle: e.target.value } : x))} />
+                <input placeholder="Per-upload description (optional)" className="p-1 text-sm border w-full mt-1" value={(it as any).metaDescription||''} onChange={e=> setItems(s=>s.map(x=> x.id===it.id ? { ...x, metaDescription: e.target.value } : x))} />
+              </div>
             <div className="w-full bg-black h-2 rounded mt-2 overflow-hidden">
               <div style={{ width: `${it.progress}%` }} className="h-2 bg-green-400" />
             </div>
           </div>
-            <div className="ml-4 flex flex-col gap-2">
+            <div className="ml-4 flex flex-col gap-2">
               {it.status === 'uploading' && <button onClick={()=>cancelUpload(it.id)} className="px-2 py-1 bg-yellow-500 rounded">Cancel</button>}
               {it.status === 'error' && <button onClick={()=>retryUpload(it.id)} className="px-2 py-1 bg-blue-500 rounded">Retry</button>}
               {(it.status === 'success' || it.status === 'canceled' || it.status === 'error') && <button onClick={()=>removeItem(it.id)} className="px-2 py-1 bg-gray-600 rounded">Remove</button>}
+              <button onClick={()=>openCreatorForItem(it.id)} className="px-2 py-1 bg-indigo-600 rounded text-white">Create Episode for this file</button>
             </div>
           </div>
         ))}
       </div>
+      {creatorOpenFor && <EpisodeCreatorModal open={true} onClose={closeCreator} onCreated={(ep)=> onEpisodeCreatedForItem(creatorOpenFor, ep)} />}
     </div>
   )
 }
*** End Patch
