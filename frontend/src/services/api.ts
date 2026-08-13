import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true
})

let accessToken: string | null = localStorage.getItem('av_access') || null

export function setAccessToken(token: string | null){
  accessToken = token
  if(token){
    localStorage.setItem('av_access', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }else{
    localStorage.removeItem('av_access')
    delete api.defaults.headers.common['Authorization']
  }
}

if(accessToken){
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
}

export default api
