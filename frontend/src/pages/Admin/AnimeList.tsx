import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminAnime, deleteAnime as deleteA } from '../../services/admin'

export default function AnimeList(){
  const [items,setItems] = useState<any[]>([])

  useEffect(()=>{
    (async ()=>{
      const res = await getAdminAnime()
      setItems(res)
    })()
  },[])

  const onDelete = async (id:string)=>{
    if(!confirm('Delete anime?')) return
    await deleteA(id)
    setItems(items.filter(i=>i.id!==id))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Anime</h2>
      <div className="grid gap-3">
        {items.map(a=> (
          <div key={a.id} className="glass p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm text-gray-400">{a.slug}</div>
            </div>
            <div className="space-x-2">
              <Link to={`/admin/anime/${a.id}/edit`} className="px-3 py-1 bg-gray-800 rounded">Edit</Link>
              <Link to={`/admin/anime/${a.id}/episodes`} className="px-3 py-1 bg-gray-800 rounded">Episodes</Link>
              <button onClick={()=>onDelete(a.id)} className="px-3 py-1 bg-red-600 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
