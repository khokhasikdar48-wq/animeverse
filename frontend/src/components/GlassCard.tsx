import React from 'react'

export default function GlassCard({children}:{children:React.ReactNode}){
  return (
    <div className="glass p-3 rounded-md shadow-sm">
      {children}
    </div>
  )
}
