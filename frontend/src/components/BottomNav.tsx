import React from 'react'
import { NavLink } from 'react-router-dom'

export default function BottomNav(){
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-black/60 backdrop-blur-md p-2 flex justify-around">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/search">Search</NavLink>
      <NavLink to="/watchlist">Watchlist</NavLink>
      <NavLink to="/account">Account</NavLink>
    </nav>
  )
}
