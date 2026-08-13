import React, { useEffect, useState } from 'react'
import { getAdsMetrics } from '../../services/metrics'

export default function AdminAdsMetrics(){
  const [metrics,setMetrics] = useState<any | null>(null)

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      try{
        const res = await getAdsMetrics()
        if(mounted) setMetrics(res)
      }catch(e){ console.error('Failed to fetch metrics', e) }
    }
    fetch()
    const id = setInterval(fetch, 15000)
    return ()=>{ mounted=false; clearInterval(id) }
  },[])

  if(!metrics) return <div>Loading metrics...</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ad Unlock Metrics</h2>
      <div className="grid gap-4">
        <div className="glass p-4">
          <div className="text-sm text-gray-500">Last 24h</div>
          <div className="text-3xl font-bold">{metrics.totalUnlocksLast24h}</div>
          <div className="text-sm text-gray-400">Init attempts: {metrics.totalInitsLast24h}</div>
        </div>

        <div className="glass p-4">
          <div className="text-sm text-gray-500">Top episodes (last 7 days)</div>
          <ul className="mt-2">
            {metrics.topEpisodes.map((t:any)=>(
              <li key={t.episodeId} className="flex justify-between"><span>Episode {t.episodeId}</span><span className="font-semibold">{t.cnt}</span></li>
            ))}
          </ul>
        </div>

        <div className="glass p-4">
          <div className="text-sm text-gray-500">Daily (last 7 days)</div>
          <table className="w-full mt-2 text-sm">
            <thead><tr><th>Date</th><th>Inits</th><th>Unlocks</th></tr></thead>
            <tbody>
              {metrics.daily.map((d:any)=>(
                <tr key={d.date}><td>{d.date}</td><td>{d.inits}</td><td>{d.unlocks}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
