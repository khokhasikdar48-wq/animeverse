import api from './api'

export async function listJobs(){
  const res = await api.get('/admin/jobs')
  return res.data.jobs
}

export async function getJob(id:string){
  const res = await api.get(`/admin/jobs/${id}`)
  return res.data
}
