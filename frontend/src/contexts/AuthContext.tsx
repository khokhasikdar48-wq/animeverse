import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/auth'

const AuthContext = createContext<any>(null)

export function AuthProvider({children}:{children:React.ReactNode}){
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      try{
        const u = await authService.me()
        setUser(u)
      }catch(err){
        setUser(null)
      }finally{setLoading(false)}
    })()
  },[])

  const login = async (email:string,password:string)=>{
    const u = await authService.login(email,password)
    setUser(u)
    return u
  }

  const logout = async ()=>{
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{user,loading,login,logout}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}
