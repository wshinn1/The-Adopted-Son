'use client'

import { useState, useEffect, type ReactNode } from 'react'
import SplashScreen from './SplashScreen'
import { SplashContext } from './SplashContext'

interface HomePageClientProps {
  children: ReactNode
}

export default function HomePageClient({ children }: HomePageClientProps) {
  // Start with null to indicate "not yet determined"
  const [showSplash, setShowSplash] = useState<boolean | null>(null)
  const [isSplashComplete, setIsSplashComplete] = useState(false)

  // Check sessionStorage on mount
  useEffect(() => {
    const seen = sessionStorage.getItem('hasSeenSplash')
    if (seen === 'true') {
      // User has already seen splash this session
      setShowSplash(false)
      setIsSplashComplete(true)
    } else {
      // First visit this session - show splash
      setShowSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('hasSeenSplash', 'true')
    // Small delay to let the page render before starting animations
    setTimeout(() => {
      setIsSplashComplete(true)
    }, 300)
  }

  // Don't render anything until we know whether to show splash
  if (showSplash === null) {
    return (
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2B4A6F 50%, #4A3828 100%)',
        }}
      />
    )
  }

  return (
    <SplashContext.Provider value={{ isSplashComplete }}>
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} duration={5000} />
      )}
      <div 
        style={{ 
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {children}
      </div>
    </SplashContext.Provider>
  )
}
