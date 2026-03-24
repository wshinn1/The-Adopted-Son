'use client'

import { useState, useEffect } from 'react'
import SplashScreen from './SplashScreen'
import PageRenderer from './PageRenderer'

interface HomePageClientProps {
  sections: any[]
}

export default function HomePageClient({ sections }: HomePageClientProps) {
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
        <PageRenderer sections={sections} />
      </div>
    </>
  )
}
