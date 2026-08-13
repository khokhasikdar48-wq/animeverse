import api, { setAccessToken } from './api'

export async function login(email:string, password:string){
  const res = await api.post('/auth/login', { email, password })
  const { accessToken, user } = res.data
  setAccessToken(accessToken)
  return user
}

export async function logout(){
  await api.post('/auth/logout')
  setAccessToken(null)
}

export async function me(){
  const res = await api.get('/auth/me')
  return res.data.user
}

export async function acceptInvite(token:string, password:string, name?:string){
  const res = await api.post('/auth/invite/accept', { token, password, name })
  return res.data
}

export async function getSignedUpload(filename:string){
  const res = await api.post('/admin/uploads/signed-url', { filename })
  return res.data
}
