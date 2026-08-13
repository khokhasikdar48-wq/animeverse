import api from './api'

export async function listJobs(){
  const res = await api.get('/admin/jobs')
  return res.data.jobs
}

export async function getJob(id:string){
  const res = await api.get(`/admin/jobs/${id}`)
  return res.data
}

export async function retryJob(id:string){
  const res = await api.post(`/admin/jobs/${id}/retry`)
  return res.data
}

export async function cancelJob(id:string){
  const res = await api.post(`/admin/jobs/${id}/cancel`)
  return res.data
}
