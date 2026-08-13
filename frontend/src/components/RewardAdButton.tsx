import React, { useState } from 'react'
import { initRewardAd, verifyRewardAd, checkRewardStatus } from '../services/ads'

// A small reward-ad button component. Integrate real ad SDK by replacing the mockAdPlay function.
export default function RewardAdButton({ episodeId, onUnlocked }:{ episodeId:string, onUnlocked?:()=>void }){
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string | null>(null)

  async function onWatch(){
    setError(null)
    setLoading(true)
    try{
      // init on server to get nonce and provider metadata
      const init = await initRewardAd(episodeId)
      const serverNonce = init.serverNonce

      // In production, call ad provider SDK here to show the rewarded ad and obtain a completion token.
      // Example: const completionToken = await provider.showRewardedAd(init.adUnitId, { serverNonce })
      // For now, we simulate with a mock flow (no forced clicks): open a small in-app video modal or simulate success.

      const completionToken = await mockAdPlay(serverNonce)

      const verify = await verifyRewardAd(episodeId, completionToken, serverNonce)
      if(verify.unlocked){
        if(onUnlocked) onUnlocked()
      }else{
        setError('Verification failed')
      }
    }catch(err:any){
      setError(err?.message || 'Ad failed')
    }finally{ setLoading(false) }
  }

  return (
    <div>
      <button onClick={onWatch} disabled={loading} className="px-3 py-2 bg-accent rounded text-black">{loading ? 'Watching...' : 'Watch ad to unlock'}</button>
      {error && <div className="text-red-400 mt-2">{error}</div>}
    </div>
  )
}

// Simulated ad playback that resolves to a completion token. Replace with provider SDK integration.
function mockAdPlay(serverNonce?:string){
  return new Promise<string>((resolve)=>{
    // Simulate an in-app non-click forced ad: brief timeout to emulate video
    setTimeout(()=>{
      resolve('MOCK_AD_COMPLETED')
    }, 1500)
  })
}
