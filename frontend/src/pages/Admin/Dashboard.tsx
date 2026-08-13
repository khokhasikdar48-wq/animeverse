import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminDashboard(){
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="glass p-4 max-w-lg space-y-2">
        <Link to="/admin/anime" className="block p-2 bg-gray-800 rounded">Manage Anime</Link>
        <Link to="/admin/anime/new" className="block p-2 bg-gray-800 rounded">Create New Anime</Link>
        <Link to="/admin/invite" className="block p-2 bg-gray-800 rounded">Create Invite</Link>
      </div>
    </div>
  )
}
