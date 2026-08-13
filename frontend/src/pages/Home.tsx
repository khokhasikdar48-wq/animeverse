import React from 'react'
import HeroBanner from '../components/HeroBanner'
import AnimeCard from '../components/AnimeCard'

export default function Home(){
  const demo = [
    {title:'Shadow of the Moon'},
    {title:'Crystal Warriors'},
    {title:'Village of Dragons'},
    {title:'Sky Adventure'}
  ]

  return (
    <div>
      <HeroBanner />

      <section>
        <h2 className="text-xl font-bold mb-3">Trending</h2>
        <div className="flex gap-4 overflow-auto pb-4">
          {demo.map(a=> <AnimeCard key={a.title} title={a.title} />)}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold mb-3">Continue Watching</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {demo.map(a=> <AnimeCard key={a.title} title={a.title} />)}
        </div>
      </section>
    </div>
  )
}
