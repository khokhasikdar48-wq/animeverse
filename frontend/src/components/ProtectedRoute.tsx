import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly=false }: { children: React.ReactElement, adminOnly?: boolean }){
  const { user, loading } = useAuth()
  if(loading) return <div>Loading...</div>
  if(!user) return <Navigate to="/login" replace />
  if(adminOnly && !user.isAdmin) return <div>Unauthorized</div>
  return children
}
