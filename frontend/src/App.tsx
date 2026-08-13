import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import AnimeDetail from './pages/AnimeDetail'
import Episode from './pages/Episode'
import Watchlist from './pages/Watchlist'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Account from './pages/Account'
import AdminDashboard from './pages/Admin/Dashboard'
import NavBar from './components/NavBar'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="min-h-screen text-gray-100">
      <div className="md:flex">
        <NavBar />
        <main className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/anime/:slug" element={<AnimeDetail />} />
            <Route path="/anime/:slug/episode/:number" element={<Episode />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
