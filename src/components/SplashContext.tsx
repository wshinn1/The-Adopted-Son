'use client'

import { createContext, useContext } from 'react'

interface SplashContextType {
  isSplashComplete: boolean
}

export const SplashContext = createContext<SplashContextType>({
  isSplashComplete: false,
})

export function useSplashComplete() {
  return useContext(SplashContext).isSplashComplete
}
