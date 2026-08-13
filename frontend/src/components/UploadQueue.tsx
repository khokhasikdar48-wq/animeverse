import React, { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import axios from 'axios'

export type UploadItem = {
  id: string
  file: File
  targetType: string
  targetId?: string | null
  progress: number
  status: 'queued' | 'uploading' | 'success' | 'error' | 'canceled'
  error?: string | null
}

export default function UploadQueue({ initial=[] as File[], targetType='episode_video', targetId='' }: { initial?: File[]; targetType?: string; targetId?: string | null }){
  const [items, setItems] = useState<UploadItem[]>(() => initial.map((f,i)=>({ id: `${Date.now()}-${i}`, file: f, targetType, targetId, progress:0, status:'queued', error:null })))
  const inputRef = useRef<HTMLInputElement | null>(null)
  const concurrency = 2
  const controllers = useRef<Record<string, AbortController>>({})

  useEffect(()=>{
    // start processing whenever items change
    processQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  function addFiles(files: FileList | File[]){
    const arr = Array.from(files as any)
    const newItems = arr.map((f,i)=>({ id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`, file:f, targetType, targetId, progress:0, status:'queued', error:null }))
    setItems(s=>[...s, ...newItems])
  }

  function removeItem(id:string){
    setItems(s=>s.filter(it=>it.id!==id))
  }

  function clearCompleted(){
    setItems(s=>s.filter(it=> it.status==='uploading' || it.status==='queued'))
  }

  async function processQueue(){
    // count active
    const active = items.filter(i=>i.status==='uploading').length
    const queued = items.filter(i=>i.status==='queued')
    const slots = concurrency - active
    if(slots <= 0) return
    const toStart = queued.slice(0, slots)
    toStart.forEach(startUpload)
  }

  async function startUpload(item: UploadItem){
    setItems(s=>s.map(it=> it.id===item.id ? { ...it, status:'uploading', progress:0, error:null } : it))
    const controller = new AbortController()
    controllers.current[item.id] = controller
    try{
      // get signed url
      const signedRes = await api.post('/admin/uploads/signed-url', { filename: item.file.name, targetType: item.targetType, targetId: item.targetId })
      const uploadUrl = signedRes.data.uploadUrl
      // If uploadUrl is a local mock path (starts with /), post multipart to server mock endpoint
      if(uploadUrl && uploadUrl.startsWith('/')){
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
        if(signedRes.data.key){
          try{ await api.post('/admin/uploads/notify', { key: signedRes.data.key, targetType: item.targetType, targetId: item.targetId }) }catch(e){ console.warn('notify failed', e) }
        }
      }
      setItems(s=>s.map(it=> it.id===item.id ? { ...it, status:'success', progress:100 } : it))
    }catch(err:any){
      if(err?.name === 'CanceledError' || err?.message === 'canceled'){
        setItems(s=>s.map(it=> it.id===item.id ? { ...it, status:'canceled', error:'Upload canceled' } : it))
      } else {
        console.error('upload failed', err?.message || err)
        setItems(s=>s.map(it=> it.id===item.id ? { ...it, status:'error', error: err?.message || 'Upload failed' } : it))
      }
    }finally{
      delete controllers.current[item.id]
    }
  }

  function cancelUpload(id:string){
    const ctl = controllers.current[id]
    if(ctl) ctl.abort()
    setItems(s=>s.map(it=> it.id===id ? { ...it, status:'canceled', error:'Canceled by user' } : it))
  }

  function retryUpload(id:string){
    setItems(s=>s.map(it=> it.id===id ? { ...it, status:'queued', progress:0, error:null } : it))
  }

  return (
    <div>
      <div className="mb-3">
        <input ref={inputRef} type="file" multiple onChange={e=>{ if(e.target.files) addFiles(e.target.files) }} />
        <div className="mt-2 flex gap-2">
          <button onClick={()=> inputRef.current?.click()} className="px-3 py-1 bg-gray-800 rounded">Add files</button>
          <button onClick={()=> clearCompleted()} className="px-3 py-1 bg-gray-700 rounded">Clear completed</button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(it=> (
          <div key={it.id} className="p-3 bg-white/5 rounded flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold">{it.file.name}</div>
              <div className="text-sm text-gray-400">{it.progress}% — {it.status}{it.error ? ` — ${it.error}`:''}</div>
              <div className="w-full bg-black h-2 rounded mt-2 overflow-hidden">
                <div style={{ width: `${it.progress}%` }} className="h-2 bg-green-400" />
              </div>
            </div>
            <div className="ml-4 flex flex-col gap-2">
              {it.status === 'uploading' && <button onClick={()=>cancelUpload(it.id)} className="px-2 py-1 bg-yellow-500 rounded">Cancel</button>}
              {it.status === 'error' && <button onClick={()=>retryUpload(it.id)} className="px-2 py-1 bg-blue-500 rounded">Retry</button>}
              {(it.status === 'success' || it.status === 'canceled' || it.status === 'error') && <button onClick={()=>removeItem(it.id)} className="px-2 py-1 bg-gray-600 rounded">Remove</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
