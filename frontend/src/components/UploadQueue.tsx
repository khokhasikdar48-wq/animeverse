---
*** Begin Patch
*** Update File: frontend/src/components/UploadQueue.tsx
@@
 export default function UploadQueue({ initial=[] as File[], targetType='episode_video', targetId='' }: { initial?: File[]; targetType?: string; targetId?: string | null }){
-  const [items, setItems] = useState<UploadItem[]>( () => initial.map((f,i)=>({ id: `${Date.now()}-${i}`, file: f, targetType, targetId, progress:0, status:'queued', error:null })))
+  const [items, setItems] = useState<UploadItem[]>( () => initial.map((f,i)=>({ id: `${Date.now()}-${i}`, file: f, targetType, targetId, progress:0, status:'queued', error:null })))
   const inputRef = useRef<HTMLInputElement | null>(null)
   const concurrency = 2
   const controllers = useRef<Record<string, AbortController>>({})
@@
   function addFiles(files: FileList | File[]){
     const arr = Array.from(files as any)
     const newItems = arr.map((f,i)=>({ id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`, file:f, targetType, targetId, progress:0, status:'queued', error:null }))
     setItems(s=>[...s, ...newItems])
   }
@@
   return (
     <div>
-      <div className="mb-3">
-        <input ref={inputRef} type="file" multiple onChange={e=>{ if(e.target.files) addFiles(e.target.files) }} />
-        <div className="mt-2 flex gap-2">
-          <button onClick={()=> inputRef.current?.click()} className="px-3 py-1 bg-gray-800 rounded">Add files</button>
-          <button onClick={()=> clearCompleted()} className="px-3 py-1 bg-gray-700 rounded">Clear completed</button>
-        </div>
-      </div>
+      <div className="mb-3">
+        <div onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer!.dropEffect = 'copy' }} onDrop={(e)=>{ e.preventDefault(); if(e.dataTransfer?.files) addFiles(e.dataTransfer.files) }} className="p-6 border-dashed border-2 border-gray-700 rounded text-center bg-black/20">
+          <div className="mb-2">Drag & drop video files here, or</div>
+          <div>
+            <input ref={inputRef} type="file" multiple onChange={e=>{ if(e.target.files) addFiles(e.target.files) }} style={{ display:'none' }} />
+            <button onClick={()=> inputRef.current?.click()} className="px-3 py-1 bg-gray-800 rounded">Select files</button>
+            <button onClick={()=> clearCompleted()} className="ml-2 px-3 py-1 bg-gray-700 rounded">Clear completed</button>
+          </div>
+        </div>
+      </div>
*** End Patch
