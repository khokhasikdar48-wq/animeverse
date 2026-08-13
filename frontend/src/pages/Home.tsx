import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Home(){
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      try{
        const res = await api.get('/anime?limit=12')
        if(mounted) setFeatured(res.data.anime || res.data)
      }catch(e){ console.warn(e) }
    }
    fetch()
    return ()=>{ mounted=false }
  },[])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <div className="grid grid-cols-4 gap-4">
        {featured.map(a=> (
          <Link key={a.id} to={`/anime/${a.slug}`} className="block p-3 bg-white/5 rounded">
            <div className="font-semibold">{a.title}</div>
            <div className="text-sm text-gray-400">{a.description?.slice(0,80)}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
