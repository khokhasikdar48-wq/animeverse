import React from 'react'

export default function Login(){
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form className="space-y-3">
        <input className="w-full p-3 rounded bg-gray-800" placeholder="Email" />
        <input className="w-full p-3 rounded bg-gray-800" placeholder="Password" type="password" />
        <button className="w-full p-3 bg-accent text-black rounded">Login</button>
      </form>
    </div>
  )
}
