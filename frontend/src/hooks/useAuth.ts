import { useState, useEffect } from 'react'

export default function useAuth(){
  const [user,setUser] = useState(null as any)
  useEffect(()=>{
    // placeholder: call /api/auth/me to get user
  },[])
  return {user}
}
