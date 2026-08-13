import api from './api'

export async function initRewardAd(episodeId:string){
  const res = await api.post('/ads/reward/init', { episodeId })
  return res.data
}

export async function verifyRewardAd(episodeId:string, completionToken:string, serverNonce?:string){
  const res = await api.post('/ads/reward/verify', { episodeId, completionToken, serverNonce })
  return res.data
}

export async function checkRewardStatus(episodeId:string){
  const res = await api.get(`/ads/reward/status?episodeId=${episodeId}`)
  return res.data
}
