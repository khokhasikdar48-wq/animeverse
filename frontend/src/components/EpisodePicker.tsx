import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function EpisodePicker({ value, onChange }:{ value?: string | null, onChange: (episodeId: string | null)=>void }){
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null)
  const [episodes, setEpisodes] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    if(!query) { setResults([]); return }
    const id = setTimeout(async ()=>{
      try{
        const res = await api.get(`/anime?search=${encodeURIComponent(query)}`)
        if(mounted) setResults(res.data.anime || res.data)
      }catch(e){ console.warn(e) }
    }, 300)
    return ()=>{ mounted=false; clearTimeout(id) }
  },[query])

  async function onSelectAnime(a:any){
    setSelectedAnime(a)
    setResults([])
    setQuery('')
    try{
      const res = await api.get(`/anime/${a.slug}`)
      const data = res.data.anime || res.data
      setEpisodes(data.episodes || [])
    }catch(e){ console.warn(e) }
  }

  useEffect(()=>{
    // if value cleared externally, reset selection
    if(!value){ setSelectedAnime(null); setEpisodes([]) }
  },[value])

  return (
    <div className="mb-4">
      <label className="block text-sm mb-1">Select Anime</label>
      <input className="p-2 border w-full" placeholder="Search anime by title..." value={query} onChange={e=>setQuery(e.target.value)} />
      {results.length > 0 && (
        <ul className="bg-white/5 mt-2 rounded max-h-48 overflow-auto">
          {results.map(r=> (
            <li key={r.id} className="p-2 hover:bg-white/10 cursor-pointer" onClick={()=>onSelectAnime(r)}>{r.title}</li>
          ))}
        </ul>
      )}

      {selectedAnime && (
        <div className="mt-3">
          <div className="font-semibold">Selected: {selectedAnime.title}</div>
          <label className="block text-sm mt-2">Select Episode</label>
          <select className="p-2 border w-full mt-1" value={value||''} onChange={e=>onChange(e.target.value || null)}>
            <option value="">-- Choose episode (optional) --</option>
            {episodes.map((ep:any)=>(
              <option key={ep.id} value={ep.id}>Ep {ep.episodeNumber} — {ep.title}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
