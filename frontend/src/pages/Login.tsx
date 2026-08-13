import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState<string | null>(null)
  const { login } = useAuth()
  const nav = useNavigate()

  const onSubmit = async (e:any) =>{
    e.preventDefault()
    setError(null)
    try{
      await login(email,password)
      nav('/')
    }catch(err:any){
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 rounded bg-gray-800" placeholder="Email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 rounded bg-gray-800" placeholder="Password" type="password" />
        {error && <div className="text-red-400">{error}</div>}
        <button type="submit" className="w-full p-3 bg-accent text-black rounded">Login</button>
      </form>
    </div>
  )
}
