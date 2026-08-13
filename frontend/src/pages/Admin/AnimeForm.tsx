import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAnime, updateAnime, getAdminAnime } from '../../services/admin'
import { getSignedUpload } from '../../services/auth'

export default function AnimeForm(){
  const { id } = useParams()
  const nav = useNavigate()
  const [title,setTitle] = useState('')
  const [slug,setSlug] = useState('')
  const [desc,setDesc] = useState('')
  const [year,setYear] = useState('')
  const [posterFile,setPosterFile] = useState<File | null>(null)

  useEffect(()=>{
    if(id){
      (async ()=>{
        const list = await getAdminAnime()
        const item = list.find((x:any)=>x.id===id)
        if(item){
          setTitle(item.title); setSlug(item.slug); setDesc(item.description||''); setYear(item.year||'')
        }
      })()
    }
  },[id])

  const onSave = async ()=>{
    if(!title||!slug) return alert('title and slug required')
    if(id){
      await updateAnime(id, { title, slug, description: desc, year: year?Number(year):undefined })
      alert('Saved')
      nav('/admin/anime')
    }else{
      const anime = await createAnime({ title, slug, description: desc, year: year?Number(year):undefined })
      // if poster uploaded, upload and link
      if(posterFile){
        const signed = await getSignedUpload(posterFile.name)
        // mock uploads expect form-data file + targetType + targetId
        const form = new FormData()
        form.append('file', posterFile)
        form.append('targetType','anime_poster')
        form.append('targetId', anime.id)
        await fetch(signed.uploadUrl, { method: 'POST', body: form, credentials: 'include' })
      }
      nav('/admin/anime')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{id? 'Edit' : 'Create'} Anime</h2>
      <div className="glass p-4 max-w-lg">
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" placeholder="Title" />
        <input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" placeholder="Slug" />
        <input value={year} onChange={e=>setYear(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" placeholder="Year" />
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" placeholder="Description" />
        <div className="mb-2">
          <label className="block text-sm">Poster (optional)</label>
          <input type="file" onChange={e=>setPosterFile(e.target.files?.[0]||null)} />
        </div>
        <div className="mt-3">
          <button onClick={onSave} className="px-4 py-2 bg-accent rounded text-black">Save</button>
        </div>
      </div>
    </div>
  )
}
