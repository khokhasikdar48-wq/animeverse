import React, { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function VideoPlayer({src}:{src?:string}){
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(()=>{
    const video = videoRef.current
    if(!video) return
    if(!src){
      video.removeAttribute('src')
      return
    }

    // HLS handling
    if(src.endsWith('.m3u8')){
      if(Hls.isSupported()){
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (event, data)=>{
          console.error('hls error', event, data)
        })
        return ()=>{ hls.destroy() }
      }else if(video.canPlayType('application/vnd.apple.mpegurl')){
        // Native HLS support (Safari)
        video.src = src
      }else{
        console.warn('HLS not supported in this browser')
      }
    }else{
      // standard mp4 or other
      video.src = src
    }
  },[src])

  return (
    <div className="w-full bg-black rounded-md overflow-hidden">
      <video controls className="w-full" ref={videoRef} />
    </div>
  )
}
