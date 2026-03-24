'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface SplashScreenProps {
  onComplete: () => void
  duration?: number // in milliseconds
}

export default function SplashScreen({ onComplete, duration = 5000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [textAnimationComplete, setTextAnimationComplete] = useState(false)
  const onCompleteRef = useRef(onComplete)
  const hasCompletedRef = useRef(false)
  
  // Keep ref up to date
  onCompleteRef.current = onComplete

  const text = "Deep, honest devotionals for those ready to go somewhere with God."
  const words = text.split(' ')

  useEffect(() => {
    // Prevent double execution
    if (hasCompletedRef.current) return
    
    // Start fade out after duration
    const fadeTimer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    // Call onComplete after fade animation finishes
    const completeTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onCompleteRef.current()
      }
    }, duration + 1000) // 1s for fade out animation

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [duration]) // Remove onComplete from deps - use ref instead

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2B4A6F 50%, #4A3828 100%)',
          }}
        >
          {/* Subtle animated gradient overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(232, 165, 71, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(232, 165, 71, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(232, 165, 71, 0.3) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Text container */}
          <div className="relative z-10 max-w-3xl px-8 text-center">
            <motion.div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ 
                    opacity: 0, 
                    filter: 'blur(20px)',
                    y: 20,
                  }}
                  animate={{ 
                    opacity: 1, 
                    filter: 'blur(0px)',
                    y: 0,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.5 + index * 0.15,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  onAnimationComplete={() => {
                    if (index === words.length - 1) {
                      setTextAnimationComplete(true)
                    }
                  }}
                  className="text-2xl md:text-4xl lg:text-5xl font-light tracking-wide"
                  style={{
                    color: '#ffffff',
                    fontFamily: 'var(--font-hero, Georgia, serif)',
                    fontStyle: 'italic',
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>

            {/* Subtle decorative line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ 
                scaleX: textAnimationComplete ? 1 : 0, 
                opacity: textAnimationComplete ? 1 : 0 
              }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="mt-8 mx-auto h-px w-32"
              style={{
                background: 'linear-gradient(90deg, transparent, #E8A547, transparent)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
