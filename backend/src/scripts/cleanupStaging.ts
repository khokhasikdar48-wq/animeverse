import path from 'path'
import fs from 'fs'

// Cleanup script to remove old staging files and HLS outputs
// Usage: NODE_ENV=production node dist/scripts/cleanupStaging.js  or ts-node src/scripts/cleanupStaging.ts

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
const workDir = path.join(uploadsDir, 'work')
const hlsDir = path.join(uploadsDir, 'hls')

const retentionDays = Number(process.env.STAGING_RETENTION_DAYS || '7')
const now = Date.now()

function removeIfOld(p:string){
  try{
    const st = fs.statSync(p)
    const ageDays = (now - st.mtimeMs) / (1000 * 60 * 60 * 24)
    if(ageDays > retentionDays){
      if(st.isDirectory()) fs.rmSync(p, { recursive:true, force:true })
      else fs.unlinkSync(p)
      console.log('Removed', p)
    }
  }catch(e){ console.warn('Cleanup failed on',p,e?.message||e) }
}

function walkAndClean(dir:string){
  if(!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir)
  for(const e of entries){
    const full = path.join(dir, e)
    removeIfOld(full)
  }
}

console.log('Starting cleanup: retentionDays=', retentionDays)
walkAndClean(workDir)
walkAndClean(hlsDir)
console.log('Cleanup done')
