import React from 'react'

export default function ProgressBar({ value }:{ value:number }){
  return (
    <div className="w-full bg-gray-800 rounded h-3 overflow-hidden">
      <div className="h-3 bg-accent" style={{ width: `${value}%`, transition: 'width 200ms' }} />
    </div>
  )
}
