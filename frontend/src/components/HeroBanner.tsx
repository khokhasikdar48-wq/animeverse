import React from 'react'

export default function HeroBanner(){
  return (
    <section className="relative rounded-md overflow-hidden mb-6">
      <div className="h-56 md:h-96 bg-gradient-to-r from-black/60 via-transparent to-black/60 flex items-end p-6" style={{backgroundImage:'url(/banner-placeholder.jpg)', backgroundSize:'cover'}}>
        <div>
          <h2 className="text-3xl md:text-5xl font-bold">Featured: Shadow of the Moon</h2>
          <p className="mt-2 text-sm md:text-base text-gray-300">An original demo series — legally owned demo content.</p>
        </div>
      </div>
    </section>
  )
}
