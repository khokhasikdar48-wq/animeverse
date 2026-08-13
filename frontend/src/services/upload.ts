import api from './api'

export async function uploadResumable(file:File, onProgress:(p:number)=>void, chunkSize=5*1024*1024, targetType?:string, targetId?:string){
  // Try S3 multipart init first
  try{
    const initRes = await api.post('/admin/uploads/s3-multipart/init', { filename: file.name, totalSize: file.size, partSize: chunkSize })
    const { uploadId, key, urls } = initRes.data
    const total = file.size
    let uploaded = 0
    const partsInfo:any[] = []
    for(let i=0;i<urls.length;i++){
      const start = i*chunkSize
      const end = Math.min(total, start+chunkSize)
      const blob = file.slice(start,end)
      const resp = await fetch(urls[i], { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type || 'application/octet-stream' } })
      if(!resp.ok) throw new Error('Part upload failed')
      const etag = resp.headers.get('etag') || ''
      partsInfo.push({ etag, partNumber: i+1 })
      uploaded += (end-start)
      onProgress(Math.round((uploaded/total)*100))
    }
    // complete
    const completeRes = await api.post('/admin/uploads/s3-multipart/complete', { uploadId, key, parts: partsInfo, targetType, targetId })
    return completeRes.data
  }catch(err){
    console.warn('S3 multipart failed, falling back to server resumable', err)
  }

  // init server-side resumable
  const init = await api.post('/admin/uploads/init', { filename: file.name, totalSize: file.size })
  const uploadId = init.data.uploadId
  const total = file.size
  let uploaded = 0
  const chunks = Math.ceil(total / chunkSize)
  for(let i=0;i<chunks;i++){
    const start = i*chunkSize
    const end = Math.min(total, start+chunkSize)
    const blob = file.slice(start,end)
    const form = new FormData()
    form.append('chunk', blob)
    await api.put(`/admin/uploads/chunk/${uploadId}?index=${i}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    uploaded += (end-start)
    onProgress(Math.round((uploaded/total)*100))
  }
  const completeRes = await api.post('/admin/uploads/complete', { uploadId, targetType, targetId })
  return completeRes.data
}
