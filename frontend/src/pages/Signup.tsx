import React from 'react'

export default function Signup(){
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Sign up</h2>
      <form className="space-y-3">
        <input className="w-full p-3 rounded bg-gray-800" placeholder="Name" />
        <input className="w-full p-3 rounded bg-gray-800" placeholder="Email" />
        <input className="w-full p-3 rounded bg-gray-800" placeholder="Password" type="password" />
        <button className="w-full p-3 bg-accent text-black rounded">Create account</button>
      </form>
    </div>
  )
}
