---
*** Begin Patch
*** Update File: frontend/src/pages/Episode.tsx
@@
 import VideoPlayer from '../components/VideoPlayer'
+import RewardAdButton from '../components/RewardAdButton'
+import { checkRewardStatus } from '../services/ads'
@@
 export default function EpisodePage(){
   const { slug, epNumber } = useParams()
   const [episode, setEpisode] = useState<any>(null)
+  const [unlocked, setUnlocked] = useState(false)
@@
   useEffect(()=>{
     let mounted = true
     async function fetch(){
       const data = await getEpisodeBySlug(slug as string, Number(epNumber))
       if(mounted) setEpisode(data)
+      // check reward unlock status for current user
+      try{
+        const st = await checkRewardStatus(data.id)
+        if(mounted) setUnlocked(st.unlocked)
+      }catch(e){ }
     }
     fetch()
     return ()=>{ mounted=false }
   },[slug, epNumber])
@@
-        {episode.videoUrl ? <VideoPlayer src={episode.videoUrl} /> : <div className="p-4">This episode is not available.</div>}
+        {episode.videoUrl || unlocked ? <VideoPlayer src={episode.videoUrl || ''} /> : (
+          <div className="p-4">
+            <div>This episode is locked. You can watch a short ad to unlock it temporarily.</div>
+            <div className="mt-3"><RewardAdButton episodeId={episode.id} onUnlocked={async ()=>{ setUnlocked(true); /* optionally re-fetch episode to show videoUrl after verify */ const data = await getEpisodeBySlug(slug as string, Number(epNumber)); setEpisode(data) }} /></div>
+          </div>
+        )}
*** End Patch
