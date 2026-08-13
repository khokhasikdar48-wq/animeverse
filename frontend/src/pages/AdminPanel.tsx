import React, { useState } from 'react'
import api from '../../services/api'

export default function AdminPanel(){
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      <div className="grid grid-cols-3 gap-4">
        <a href="/admin/anime/new" className="p-4 bg-white/5 rounded">Create Anime</a>
        <a href="/admin/anime" className="p-4 bg-white/5 rounded">Manage Anime</a>
        <a href="/admin/upload" className="p-4 bg-white/5 rounded">Upload Video</a>
        <a href="/admin/jobs" className="p-4 bg-white/5 rounded">Jobs</a>
        <a href="/admin/ads-metrics" className="p-4 bg-white/5 rounded">Ads Metrics</a>
      </div>
    </div>
  )
}
