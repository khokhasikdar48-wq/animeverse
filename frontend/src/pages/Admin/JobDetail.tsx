import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJob, retryJob, cancelJob } from '../../services/jobs'
import api from '../../services/api'

export default function JobDetail(){
@@
   const [job, setJob] = useState<any>(null)
   const [loading, setLoading] = useState(true)
+  const [logs, setLogs] = useState<string | null>(null)
@@
   useEffect(()=>{
     let mounted = true
     async function fetch(){
       if(!id) return
       setLoading(true)
       try{
         const res = await getJob(id)
         if(mounted) setJob(res)
+        try{
+          const logRes = await api.get(`/admin/jobs/${id}/logs`)
+          if(mounted) setLogs(logRes.data)
+        }catch(e){ /* ignore */ }
       }catch(err){
       }finally{ if(mounted) setLoading(false) }
     }
     fetch()
     const iv = setInterval(fetch, 4000)
     return ()=>{ mounted=false; clearInterval(iv) }
   },[id])
@@
         <div className="flex gap-2 mt-3">
           <button onClick={onRetry} className="px-3 py-2 bg-accent rounded">Retry</button>
           <button onClick={onCancel} className="px-3 py-2 bg-red-600 rounded">Cancel</button>
+          {logs && <a href={`/api/admin/jobs/${id}/logs`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-gray-700 rounded">View Logs</a>}
         </div>
       </div>
+      {logs && <pre className="mt-4 p-3 bg-black text-green-200 rounded max-w-3xl whitespace-pre-wrap">{logs}</pre>}
     </div>
   )
 }
