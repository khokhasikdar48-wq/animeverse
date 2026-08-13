import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import AnimeDetails from './pages/AnimeDetails'
import EpisodePage from './pages/Episode'
import Login from './pages/Login'
import AdminPanel from './pages/AdminPanel'
import AdminJobs from './pages/Admin/Jobs'
import AdminJobDetail from './pages/Admin/JobDetail'
import AdminAdsMetrics from './pages/Admin/AdsMetrics'
import AdminEpisodes from './pages/Admin/Episodes'
import AdminAnimeForm from './pages/Admin/AnimeForm'
import AdminUpload from './pages/Admin/Upload'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import TopNav from './components/TopNav'

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <TopNav />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/anime/:slug" element={<AnimeDetails />} />
            <Route path="/anime/:slug/episode/:epNumber" element={<EpisodePage />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/jobs" element={<ProtectedRoute adminOnly={true}><AdminJobs /></ProtectedRoute>} />
            <Route path="/admin/jobs/:id" element={<ProtectedRoute adminOnly={true}><AdminJobDetail /></ProtectedRoute>} />
            <Route path="/admin/ads-metrics" element={<ProtectedRoute adminOnly={true}><AdminAdsMetrics /></ProtectedRoute>} />
            <Route path="/admin/anime/:id/episodes" element={<ProtectedRoute adminOnly={true}><AdminEpisodes /></ProtectedRoute>} />
            <Route path="/admin/anime/new" element={<ProtectedRoute adminOnly={true}><AdminAnimeForm /></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute adminOnly={true}><AdminUpload /></ProtectedRoute>} />

          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
