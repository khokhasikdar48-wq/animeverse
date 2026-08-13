import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

type User = { id: string; email: string; name?: string; isAdmin?: boolean } | null

const AuthContext = createContext<{ user: User; loading: boolean; login: (email:string,password:string)=>Promise<void>; logout: ()=>Promise<void>; refresh: ()=>Promise<void> }>({ user: null, loading: true, login: async ()=>{}, logout: async ()=>{}, refresh: async ()=>{} })

export const AuthProvider = ({ children }: { children: React.ReactNode })=>{
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  async function refresh(){
    try{
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    }catch(e){
      setUser(null)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ refresh() }, [])

  async function login(email:string,password:string){
    await api.post('/auth/login', { email, password })
    await refresh()
  }

  async function logout(){
    try{ await api.post('/auth/logout') }catch(e){}
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){ return useContext(AuthContext) }
