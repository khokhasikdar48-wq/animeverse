import api from './api'

export async function uploadResumable(file:File, onProgress:(p:number)=>void, chunkSize=5*1024*1024, targetType?:string, targetId?:string){
  // init
  const initRes = await api.post('/admin/uploads/init', { filename: file.name, totalSize: file.size })
  const uploadId = initRes.data.uploadId
  const total = file.size
  let uploaded = 0
  const chunks = Math.ceil(total / chunkSize)
  for(let i=0;i<chunks;i++){
    const start = i*chunkSize
    const end = Math.min(total, start+chunkSize)
    const blob = file.slice(start,end)
    const form = new FormData()
    form.append('chunk', blob)
    // send to chunk endpoint (PUT)
    await api.put(`/admin/uploads/chunk/${uploadId}?index=${i}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    uploaded += (end-start)
    onProgress(Math.round((uploaded/total)*100))
  }
  // complete
  const completeRes = await api.post('/admin/uploads/complete', { uploadId, targetType, targetId })
  return completeRes.data
}
