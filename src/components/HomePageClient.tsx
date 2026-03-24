'use client'

import { useState, useEffect, type ReactNode } from 'react'
import SplashScreen from './SplashScreen'

interface HomePageClientProps {
  children: ReactNode
}

export default function HomePageClient({ children }: HomePageClientProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)

  // Check if user has seen splash in this session
  useEffect(() => {
    const seen = sessionStorage.getItem('hasSeenSplash')
    if (seen === 'true') {
      setShowSplash(false)
      setHasSeenSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    setHasSeenSplash(true)
    sessionStorage.setItem('hasSeenSplash', 'true')
  }

  return (
    <>
      {showSplash && !hasSeenSplash && (
        <SplashScreen onComplete={handleSplashComplete} duration={5000} />
      )}
      <div 
        style={{ 
          opacity: showSplash && !hasSeenSplash ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {children}
      </div>
    </>
  )
}
