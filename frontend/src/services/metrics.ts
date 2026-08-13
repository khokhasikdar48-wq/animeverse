import api from './api'

export async function getAdsMetrics(){
  const res = await api.get('/admin/metrics/ads')
  return res.data
}
