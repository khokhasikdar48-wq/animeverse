import React, { useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function Search(){
  const [q,setQ] = useState('')
  const [results,setResults] = useState<any[]>([])
  const [loading,setLoading] = useState(false)

  async function doSearch(e?:React.FormEvent){
    e?.preventDefault()
    setLoading(true)
    try{
      const res = await api.get(`/anime?search=${encodeURIComponent(q)}`)
      setResults(res.data.anime || res.data)
    }catch(e){ console.warn(e) }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Search</h1>
      <form onSubmit={doSearch} className="flex gap-2 mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search anime..." className="flex-1 p-2 border rounded" />
        <button className="px-3 py-2 bg-blue-600 rounded">Search</button>
      </form>
      {loading && <div>Searching…</div>}
      <div className="grid grid-cols-3 gap-3">
        {results.map(r=> (
          <Link key={r.id} to={`/anime/${r.slug}`} className="p-3 bg-white/5 rounded">{r.title}</Link>
        ))}
      </div>
    </div>
  )
}
