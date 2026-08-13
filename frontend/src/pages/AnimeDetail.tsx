import React from 'react'
import { useParams } from 'react-router-dom'
import AnimeCard from '../components/AnimeCard'

export default function AnimeDetail(){
  const { slug } = useParams()
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <img src="/poster-placeholder.png" className="rounded-md" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{slug || 'Anime Title'}</h1>
          <p className="mt-3 text-gray-300">This is a demo description. Genres, year, status, rating, total episodes, and watchlist button will appear here.</p>
          <div className="mt-6">
            <h3 className="font-semibold">Episodes</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
              {Array.from({length:6}).map((_,i)=> <button key={i} className="p-2 bg-gray-800 rounded">EP {i+1}</button>)}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Similar</h2>
        <div className="flex gap-4">
          <AnimeCard title="Crystal Warriors" />
          <AnimeCard title="Sky Adventure" />
        </div>
      </section>
    </div>
  )
}
