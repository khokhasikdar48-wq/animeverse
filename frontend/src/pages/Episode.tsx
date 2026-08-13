import React from 'react'
import { useParams, Link } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer'

export default function Episode(){
  const { slug, number } = useParams()
  return (
    <div>
      <h1 className="text-2xl font-bold">{slug} — Episode {number}</h1>
      <div className="mt-4">
        <VideoPlayer />
      </div>
      <div className="flex gap-2 mt-4">
        <Link to="#" className="px-3 py-2 bg-gray-800 rounded">Prev</Link>
        <Link to="#" className="px-3 py-2 bg-gray-800 rounded">Next</Link>
      </div>
    </div>
  )
}
