import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState<string | null>(null)
  const { login } = useAuth()
  const nav = useNavigate()

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    setErr(null)
    try{
      await login(email,password)
      nav('/')
    }catch(e:any){ setErr(e?.message || 'Login failed') }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full p-2 border" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full p-2 border" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <div><button className="px-3 py-2 bg-blue-600 rounded">Login</button></div>
        {err && <div className="text-red-500">{err}</div>}
      </form>
    </div>
  )
}
