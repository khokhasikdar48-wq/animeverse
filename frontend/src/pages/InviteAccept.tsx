import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { acceptInvite } from '../services/auth'

export default function InviteAccept(){
  const [params] = useSearchParams()
  const tokenParam = params.get('token') || ''
  const [token,setToken] = useState(tokenParam)
  const [password,setPassword] = useState('')
  const [name,setName] = useState('')
  const [message,setMessage] = useState<string | null>(null)
  const nav = useNavigate()

  const onSubmit = async (e:any)=>{
    e.preventDefault()
    try{
      await acceptInvite(token,password,name)
      setMessage('Password set. You can now login.')
      setTimeout(()=>nav('/login'),1500)
    }catch(err:any){
      setMessage(err?.response?.data?.message || 'Invite accept failed')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Accept Invite</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={token} onChange={e=>setToken(e.target.value)} className="w-full p-3 rounded bg-gray-800" placeholder="Invite Token" />
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded bg-gray-800" placeholder="Your name (optional)" />
        <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 rounded bg-gray-800" placeholder="Password" type="password" />
        <button type="submit" className="w-full p-3 bg-accent text-black rounded">Set password</button>
      </form>
      {message && <div className="mt-3 text-gray-300">{message}</div>}
    </div>
  )
}
