import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function TopNav(){
  const { user, logout } = useAuth()
  return (
    <nav className="p-4 bg-gray-900 text-white flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-bold text-lg">Animeverse</Link>
        <Link to="/search" className="opacity-80">Search</Link>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/admin" className="opacity-80">Admin</Link>
        {user ? (
          <>
            <span className="text-sm">{user.name || user.email}</span>
            <button onClick={()=>logout()} className="ml-2 px-3 py-1 bg-gray-700 rounded">Logout</button>
          </>
        ) : (
          <Link to="/login" className="px-3 py-1 bg-green-400 text-black rounded">Login</Link>
        )}
      </div>
    </nav>
  )
}
