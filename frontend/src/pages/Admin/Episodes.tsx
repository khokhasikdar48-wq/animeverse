import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnimeEpisodes, createEpisode, updateEpisode } from '../../services/admin'
import { getSignedUpload } from '../../services/auth'

export default function EpisodeListAndForm(){
  const { id } = useParams() // anime id
  const nav = useNavigate()
  const [episodes,setEpisodes] = useState<any[]>([])
  const [title,setTitle] = useState('')
  const [epNum,setEpNum] = useState('')
  const [file,setFile] = useState<File | null>(null)

  useEffect(()=>{
    if(id){
      (async ()=>{
        const eps = await getAnimeEpisodes(id as string)
        setEpisodes(eps)
      })()
    }
  },[id])

  const onCreate = async ()=>{
    if(!title||!epNum) return alert('title and episode number required')
    const ep = await createEpisode(id as string, { title, episodeNumber: Number(epNum), description:'' })
    // if file selected, upload and link
    if(file){
      const signed = await getSignedUpload(file.name)
      const form = new FormData()
      form.append('file', file)
      form.append('targetType','episode_video')
      form.append('targetId', ep.id)
      await fetch(signed.uploadUrl, { method: signed.method||'POST', body: form, credentials: 'include' })
    }
    const eps = await getAnimeEpisodes(id as string)
    setEpisodes(eps)
    setTitle(''); setEpNum(''); setFile(null)
  }

  const onUploadToEpisode = async (episodeId:string)=>{
    if(!file) return alert('select a file first')
    const signed = await getSignedUpload(file.name)
    const form = new FormData()
    form.append('file', file)
    form.append('targetType','episode_video')
    form.append('targetId', episodeId)
    const res = await fetch(signed.uploadUrl, { method: signed.method||'POST', body: form, credentials: 'include' })
    const data = await res.json()
    alert('Uploaded: '+data.fileUrl)
    const eps = await getAnimeEpisodes(id as string)
    setEpisodes(eps)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Episodes</h2>
      <div className="glass p-4 max-w-xl mb-4">
        <div className="mb-2">Create Episode</div>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" placeholder="Title" />
        <input value={epNum} onChange={e=>setEpNum(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" placeholder="Episode Number" />
        <div className="mb-2">
          <label className="block text-sm">Video File (optional)</label>
          <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
        </div>
        <div>
          <button onClick={onCreate} className="px-3 py-2 bg-accent rounded text-black">Create Episode</button>
        </div>
      </div>

      <div className="grid gap-3">
        {episodes.map(ep=> (
          <div key={ep.id} className="glass p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">EP {ep.episodeNumber} — {ep.title}</div>
              <div className="text-sm text-gray-400">Video: {ep.videoUrl? <a href={ep.videoUrl} className="text-teal-300">{ep.videoUrl}</a> : 'Not uploaded'}</div>
            </div>
            <div>
              <button onClick={()=>onUploadToEpisode(ep.id)} className="px-3 py-1 bg-gray-800 rounded">Upload file to this episode</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
