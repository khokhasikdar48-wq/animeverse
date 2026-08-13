import React from 'react'

export default function AnimeCard({title,poster}:{title:string,poster?:string}){
  return (
    <div className="w-40">
      <div className="rounded-lg overflow-hidden">
        <img src={poster||'/poster-placeholder.png'} alt={title} className="w-full h-56 object-cover rounded-md" />
      </div>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
    </div>
  )
}
