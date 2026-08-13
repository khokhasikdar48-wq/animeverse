import { Router } from 'express'
import { transcodeQueue } from '../queues/transcodeQueue'

const router = Router()

// List recent jobs and their states
router.get('/', async (req,res)=>{
  try{
    const waiting = await transcodeQueue.getJobs(['waiting','active','completed','failed','delayed'], 0, 100)
    const formatted = await Promise.all(waiting.map(async (job:any)=>({ id: job.id, name: job.name, data: job.data, state: await job.getState(), attemptsMade: job.attemptsMade, failedReason: job.failedReason, finishedOn: job.finishedOn, processedOn: job.processedOn })))
    return res.json({ jobs: formatted })
  }catch(err:any){
    console.error('Failed to list jobs', err)
    return res.status(500).json({ message: 'Failed to list jobs' })
  }
})

router.get('/:id', async (req,res)=>{
  const id = req.params.id
  try{
    const job = await transcodeQueue.getJob(id)
    if(!job) return res.status(404).json({ message: 'Job not found' })
    const state = await job.getState()
    const logs = job.returnvalue || null
    return res.json({ id: job.id, name: job.name, data: job.data, state, attemptsMade: job.attemptsMade, failedReason: job.failedReason, returnvalue: job.returnvalue })
  }catch(err:any){
    console.error('Failed to get job', err)
    return res.status(500).json({ message: 'Failed to get job' })
  }
})

export default router
