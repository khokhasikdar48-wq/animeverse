import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import VideoPlayer from '../components/VideoPlayer'

export default function Episode(){
  const { slug, number } = useParams()
  const [episode, setEpisode] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      setLoading(true)
      // fetch anime by slug and find episode by number
      try{
        const res = await api.get(`/anime/${slug}`)
        const anime = res.data
        const ep = (anime.episodes || []).find((e:any)=>String(e.episodeNumber) === String(number))
        setEpisode(ep || null)
      }catch(err){
        setEpisode(null)
      }finally{setLoading(false)}
    })()
  },[slug, number])

  if(loading) return <div>Loading...</div>
  if(!episode) return <div>Episode not found</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">{episode.title}</h1>
      <div className="mt-4">
        {episode.videoUrl ? <VideoPlayer src={episode.videoUrl} /> : <div className="p-6 bg-gray-800 rounded">No video uploaded for this episode yet.</div>}
      </div>
      <div className="mt-4 flex gap-2">
        {/* Prev/Next could be computed using episode number and anime episodes list */}
      </div>
    </div>
  )
}
