import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function EpisodeCreatorModal({ open, onClose, initial, onCreated }:{ open:boolean, onClose:()=>void, initial?:any, onCreated:(episode:any)=>void }){
  const [animeQuery, setAnimeQuery] = useState(initial?.animeTitle || '')
  const [animeResults, setAnimeResults] = useState<any[]>([])
  const [selectedAnime, setSelectedAnime] = useState<any | null>(initial?.anime || null)
  const [episodeNumber, setEpisodeNumber] = useState(initial?.episodeNumber || '')
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [posterFile, setPosterFile] = useState<File | null>(initial?.posterFile || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if(!animeQuery) { setAnimeResults([]); return }
    const t = setTimeout(async ()=>{
      try{
        const res = await api.get(`/anime?search=${encodeURIComponent(animeQuery)}`)
        setAnimeResults(res.data.anime || res.data)
      }catch(e){ console.warn(e) }
    }, 300)
    return ()=>clearTimeout(t)
  },[animeQuery])

  async function create(){
    if(!selectedAnime) return setError('Select an anime first')
    if(!title) return setError('Provide episode title')
    setError(null)
    setLoading(true)
    try{
      const payload:any = { title, episodeNumber: episodeNumber ? Number(episodeNumber) : undefined, description }
      const res = await api.post(`/admin/anime/${selectedAnime.id}/episodes`, payload)
      const episode = res.data.episode || res.data
      // if posterFile present, upload it using signed-url
      if(posterFile){
        try{
          const signed = await api.post('/admin/uploads/signed-url', { filename: posterFile.name, targetType: 'episode_poster', targetId: episode.id })
          const uploadUrl = signed.data.uploadUrl
          if(uploadUrl.startsWith('/')){
            const form = new FormData()
            form.append('file', posterFile)
            await api.post(uploadUrl, form, { headers: { 'Content-Type': 'multipart/form-data' } })
          } else {
            // PUT to presigned url
            await fetch(uploadUrl, { method: 'PUT', body: posterFile, headers: { 'Content-Type': posterFile.type || 'image/jpeg' } })
          }
        }catch(e){ console.warn('Poster upload failed', e) }
      }

      onCreated(episode)
      onClose()
    }catch(err:any){
      console.error('Create episode failed', err)
      setError(err?.message || 'Failed to create episode')
    }finally{ setLoading(false) }
  }

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="bg-white dark:bg-gray-900 p-6 rounded z-10 w-[720px] max-h-[90vh] overflow-auto">
        <h3 className="text-xl font-bold mb-3">Create Episode</h3>
        <div className="mb-3">
          <label className="block text-sm">Anime</label>
          <input className="p-2 border w-full" value={animeQuery} onChange={e=>setAnimeQuery(e.target.value)} placeholder="Search anime by title..." />
          {animeResults.length>0 && (
            <ul className="bg-white/5 mt-2 rounded max-h-48 overflow-auto">
              {animeResults.map(a=>(
                <li key={a.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>{ setSelectedAnime(a); setAnimeResults([]); setAnimeQuery('') }}>{a.title}</li>
              ))}
            </ul>
          )}
          {selectedAnime && <div className="mt-2 text-sm">Selected: <strong>{selectedAnime.title}</strong></div>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Episode number</label>
            <input className="p-2 border w-full" value={episodeNumber} onChange={e=>setEpisodeNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Poster / thumbnail</label>
            <input type="file" className="p-2 w-full" onChange={e=>setPosterFile(e.target.files?.[0]||null)} />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm">Title</label>
          <input className="p-2 border w-full" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>

        <div className="mt-3">
          <label className="block text-sm">Description</label>
          <textarea className="p-2 border w-full" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
        </div>

        {error && <div className="text-red-500 mt-2">{error}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={create} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'Creating...' : 'Create Episode'}</button>
        </div>
      </div>
    </div>
  )
}
