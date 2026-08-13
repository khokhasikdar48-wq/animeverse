import api from './api'

export async function getAdminAnime(){
  const res = await api.get('/admin/anime')
  return res.data.items
}

export async function createAnime(data:any){
  const res = await api.post('/admin/anime', data)
  return res.data.anime
}

export async function updateAnime(id:string, data:any){
  const res = await api.put(`/admin/anime/${id}`, data)
  return res.data.anime
}

export async function deleteAnime(id:string){
  const res = await api.delete(`/admin/anime/${id}`)
  return res.data
}

export async function getAnimeEpisodes(animeId:string){
  const res = await api.get(`/admin/anime/${animeId}/episodes`)
  return res.data.episodes
}

export async function createEpisode(animeId:string, data:any){
  const res = await api.post(`/admin/anime/${animeId}/episodes`, data)
  return res.data.episode
}

export async function updateEpisode(id:string, data:any){
  const res = await api.put(`/admin/episodes/${id}`, data)
  return res.data.episode
}

export async function getSignedUpload(filename:string, targetType?:string, targetId?:string){
  const res = await api.post('/admin/uploads/signed-url', { filename, targetType, targetId })
  return res.data
}
