import React, { useEffect, useState } from 'react'
import { listJobs } from '../../services/jobs'

export default function AdminJobs(){
  const [jobs,setJobs] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      const res = await listJobs()
      if(mounted) setJobs(res)
    }
    fetch()
    const id = setInterval(fetch, 5000)
    return ()=>{ mounted=false; clearInterval(id) }
  },[])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transcode Jobs</h2>
      <div className="grid gap-3">
        {jobs.map(j=> (
          <div key={j.id} className="glass p-3">
            <div className="font-semibold">Job {j.id} — {j.name}</div>
            <div className="text-sm text-gray-400">State: {j.state} — Attempts: {j.attemptsMade}</div>
            <div className="text-sm mt-2">Target: {j.data?.targetId} — Type: {j.data?.targetType}</div>
            <div className="text-sm text-red-400 mt-2">{j.failedReason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
