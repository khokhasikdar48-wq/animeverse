import React, { useState } from 'react'
import { getSignedUpload } from '../../services/auth'

export default function AdminDashboard(){
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const onFile = (e: any) => setFile(e.target.files?.[0] ?? null)

  const onUpload = async ()=>{
    if(!file) return
    setUploading(true)
    try{
      const signed = await getSignedUpload(file.name)
      // signed: { uploadUrl, fileUrl, method }
      if(signed.uploadUrl.startsWith('/')){
        // mock upload to backend endpoint
        const form = new FormData()
        form.append('file', file)
        // include filename as query param if provided
        const uploadUrl = signed.uploadUrl + (signed.uploadUrl.includes('?') ? '' : '')
        const res = await fetch(uploadUrl, { method: signed.method || 'POST', body: form, credentials: 'include' })
        const data = await res.json()
        setResultUrl(data.fileUrl)
      }else{
        // For real signed urls, do direct PUT/POST depending on provider
        // Skipping implementation for scaffold
        setResultUrl(signed.fileUrl)
      }
    }catch(err:any){
      console.error(err)
      alert(err?.message || 'Upload failed')
    }finally{setUploading(false)}
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="glass p-4 max-w-lg">
        <h3 className="font-semibold mb-2">Upload media (mock)</h3>
        <input type="file" onChange={onFile} />
        <div className="mt-3">
          <button onClick={onUpload} disabled={!file || uploading} className="px-4 py-2 bg-accent rounded text-black">Upload</button>
        </div>
        {resultUrl && (
          <div className="mt-3">
            <div>Uploaded file URL:</div>
            <a href={resultUrl} target="_blank" className="text-sm text-teal-300">{resultUrl}</a>
          </div>
        )}
      </div>
    </div>
  )
}
