import React from 'react'

export default function Search(){
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Search</h2>
      <div className="mb-4">
        <input className="w-full p-3 rounded-md bg-gray-800" placeholder="Search anime by title..." />
      </div>
      <p className="text-sm text-gray-400">Filters will be added here (genre, year, status, sort).</p>
    </div>
  )
}
