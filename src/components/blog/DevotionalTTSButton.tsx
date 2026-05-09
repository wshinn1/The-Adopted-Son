'use client'

import { PauseIcon, PlayIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  content?: Record<string, unknown> | null
  title: string
  devotionalId: string
  voiceId?: string
  cachedAudioUrl?: string | null
  className?: string
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) return (n.content as unknown[]).map(extractText).join(' ')
  return ''
}

function contentToText(content: Record<string, unknown> | null | undefined, title: string): string {
  if (!content) return title
  const text = extractText(content).replace(/\s+/g, ' ').trim()
  return text || title
}

function storageKey(id: string) { return `tts_position_${id}` }

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}


export default function DevotionalTTSButton({
  content,
  title,
  devotionalId,
  voiceId,
  cachedAudioUrl,
  className = '',
}: Props) {
  const [status, setStatus]               = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')
  const [error, setError]                 = useState<string | null>(null)
  const [currentTime, setCurrentTime]     = useState(0)
  const [duration, setDuration]           = useState(0)
  const [savedPosition, setSavedPosition] = useState(0)
  const [srcReady, setSrcReady]           = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(devotionalId))
    if (saved) setSavedPosition(parseFloat(saved))
  }, [devotionalId])

  // Route audio through proxy that strips the Xing VBR header server-side.
  // This fixes mobile Chrome duration truncation without loading the full
  // file into memory (which fails for large files on mobile).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !cachedAudioUrl) return
    const proxied = `/api/audio-proxy?url=${encodeURIComponent(cachedAudioUrl)}`
    audio.src = proxied
    audio.preload = 'none'
    setSrcReady(true)
  }, [cachedAudioUrl])

  // Wire up event listeners once
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.currentTime > 0) {
        localStorage.setItem(storageKey(devotionalId), String(audio.currentTime))
        setSavedPosition(audio.currentTime)
      }
    }
    const onDurationChange = () => { if (isFinite(audio.duration)) setDuration(audio.duration) }
    const onEnded = () => {
      localStorage.removeItem(storageKey(devotionalId))
      setSavedPosition(0)
      setCurrentTime(0)
      setStatus('idle')
    }
    const onPause = () => {
      if (!audio.ended) setStatus('paused')
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    }
    const onPlay = () => {
      setStatus('playing')
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    }
    const onCanPlay = () => {
      if (status === 'loading') setStatus('paused')
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('canplay', onCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('canplay', onCanPlay)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devotionalId])

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (status === 'playing') {
      audio.pause()
      return
    }

    // If no src yet (no cachedAudioUrl), generate first
    if (!srcReady) {
      setError(null)
      setStatus('loading')
      try {
        const text = contentToText(content, title)
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId, devotionalId }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to generate audio')
        }
        const ct = response.headers.get('content-type') || ''
        let url: string
        if (ct.includes('application/json')) {
          const data = await response.json()
          url = data.audioUrl
        } else {
          url = URL.createObjectURL(await response.blob())
        }
        audio.src = url
        setSrcReady(true)
      } catch (err) {
        setStatus('idle')
        setError(err instanceof Error ? err.message : 'Failed to generate audio')
        return
      }
    }

    // Restore saved position on first play
    const resume = parseFloat(localStorage.getItem(storageKey(devotionalId)) ?? '0')
    if (resume > 0 && audio.currentTime === 0) audio.currentTime = resume

    // Register with OS so mobile won't kill playback
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title })
      navigator.mediaSession.setActionHandler('play',  () => audio.play())
      navigator.mediaSession.setActionHandler('pause', () => audio.pause())
    }

    // Call play() synchronously — must stay in user-gesture call stack on mobile
    audio.play().catch((err) => {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Playback failed')
    })
  }, [status, srcReady, content, title, voiceId, devotionalId])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) audioRef.current.currentTime = time
    localStorage.setItem(storageKey(devotionalId), String(time))
  }, [devotionalId])

  const isLoaded = srcReady && duration > 0
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasResume = savedPosition > 30 && status === 'idle'

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden DOM audio element — always in the DOM so play() can be called synchronously */}
      <audio ref={audioRef} playsInline style={{ display: 'none' }} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={status === 'loading'}
          aria-label={status === 'playing' ? 'Pause' : 'Play'}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        >
          {status === 'loading' && (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Loading…</span>
            </>
          )}
          {status === 'playing' && <><PauseIcon className="size-4" /><span>Pause</span></>}
          {status === 'paused'  && <><PlayIcon  className="size-4 ms-0.5" /><span>Resume</span></>}
          {status === 'idle'    && <><SpeakerWaveIcon className="size-4" /><span>Listen</span></>}
        </button>

        {hasResume && (
          <span className="text-xs text-neutral-500">
            Saved at {formatTime(savedPosition)} ·{' '}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(storageKey(devotionalId))
                setSavedPosition(0)
                if (audioRef.current) audioRef.current.currentTime = 0
              }}
              className="underline hover:text-neutral-700"
            >
              Restart from beginning
            </button>
          </span>
        )}

        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      {isLoaded && (
        <div className="flex items-center gap-3 w-full max-w-xl">
          <span className="text-xs text-neutral-400 tabular-nums w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 h-4 flex items-center group">
            <div className="absolute inset-y-0 left-0 flex items-center w-full pointer-events-none">
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-none" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={1}
              value={currentTime}
              onChange={handleSeek}
              className="relative w-full h-4 opacity-0 cursor-pointer"
              aria-label="Seek audio"
            />
            <div
              className="absolute size-3.5 rounded-full bg-blue-600 shadow pointer-events-none transition-none"
              style={{ left: `calc(${pct}% - 7px)` }}
            />
          </div>
          <span className="text-xs text-neutral-400 tabular-nums w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  )
}
