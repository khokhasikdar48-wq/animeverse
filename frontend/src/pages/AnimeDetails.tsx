import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function AnimeDetails(){
  const { slug } = useParams()
  const [anime, setAnime] = useState<any | null>(null)

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      try{
        const res = await api.get(`/anime/${slug}`)
        if(mounted) setAnime(res.data.anime || res.data)
      }catch(e){ console.warn(e) }
    }
    fetch()
    return ()=>{ mounted=false }
  },[slug])

  if(!anime) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold">{anime.title}</h1>
      <p className="mt-2 text-gray-400">{anime.description}</p>
      <h2 className="mt-6 text-xl">Episodes</h2>
      <ul className="mt-2">
        {anime.episodes?.map((ep:any)=>(
          <li key={ep.id}><Link to={`/anime/${anime.slug}/episode/${ep.episodeNumber}`} className="text-blue-400">Episode {ep.episodeNumber} — {ep.title}</Link></li>
        ))}
      </ul>
    </div>
  )
}
