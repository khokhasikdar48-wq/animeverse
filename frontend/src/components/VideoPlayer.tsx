import React from 'react'

export default function VideoPlayer({src}:{src?:string}){
  return (
    <div className="w-full bg-black rounded-md overflow-hidden">
      <video controls className="w-full" src={src || ''}>
        Your browser does not support the video element.
      </video>
    </div>
  )
}
