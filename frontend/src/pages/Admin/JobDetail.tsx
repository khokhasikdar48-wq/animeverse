import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJob, retryJob, cancelJob } from '../../services/jobs'

export default function JobDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      if(!id) return
      setLoading(true)
      try{
        const res = await getJob(id)
        if(mounted) setJob(res)
      }catch(err){
      }finally{ if(mounted) setLoading(false) }
    }
    fetch()
    const iv = setInterval(fetch, 4000)
    return ()=>{ mounted=false; clearInterval(iv) }
  },[id])

  const onRetry = async ()=>{
    if(!id) return
    await retryJob(id)
    alert('Job requeued')
  }
  const onCancel = async ()=>{
    if(!id) return
    await cancelJob(id)
    alert('Job cancelled/removed')
    nav('/admin/jobs')
  }

  if(loading) return <div>Loading...</div>
  if(!job) return <div>Job not found</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Job {job.id}</h2>
      <div className="glass p-4 max-w-2xl">
        <div className="mb-2">Name: {job.name}</div>
        <div className="mb-2">State: {job.state}</div>
        <div className="mb-2">Attempts: {job.attemptsMade}</div>
        <div className="mb-2 text-sm text-red-400">{job.failedReason}</div>
        <div className="mb-2">Target: {job.data?.targetId} ({job.data?.targetType})</div>
        <div className="flex gap-2 mt-3">
          <button onClick={onRetry} className="px-3 py-2 bg-accent rounded">Retry</button>
          <button onClick={onCancel} className="px-3 py-2 bg-red-600 rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}
