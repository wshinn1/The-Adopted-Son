'use client'

import { useState, useEffect, type ReactNode } from 'react'
import SplashScreen from './SplashScreen'
import { SplashContext } from './SplashContext'

interface HomePageClientProps {
  children: ReactNode
}

export default function HomePageClient({ children }: HomePageClientProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)
  const [isSplashComplete, setIsSplashComplete] = useState(false)

  // Check if user has seen splash in this session
  useEffect(() => {
    const seen = sessionStorage.getItem('hasSeenSplash')
    if (seen === 'true') {
      setShowSplash(false)
      setHasSeenSplash(true)
      setIsSplashComplete(true)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    setHasSeenSplash(true)
    sessionStorage.setItem('hasSeenSplash', 'true')
    // Small delay to let the page render before starting animations
    setTimeout(() => {
      setIsSplashComplete(true)
    }, 300)
  }

  return (
    <SplashContext.Provider value={{ isSplashComplete }}>
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
    </SplashContext.Provider>
  )
}
