import React from 'react'
import { Link } from 'react-router-dom'

export default function NavBar(){
  return (
    <aside className="hidden md:block w-64 p-4">
      <div className="glass p-4">
        <h1 className="text-2xl font-bold">AnimeVerse</h1>
        <nav className="mt-6">
          <ul className="space-y-3">
            <li><Link to="/" className="block">Home</Link></li>
            <li><Link to="/search" className="block">Search</Link></li>
            <li><Link to="/watchlist" className="block">Watchlist</Link></li>
            <li><Link to="/admin" className="block">Admin</Link></li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}
