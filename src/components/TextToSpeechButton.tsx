'use client'

import { TPostDetail } from '@/data/posts'
import { PauseIcon, PlayIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import { FC, useCallback, useRef, useState } from 'react'
import { useAudioPlayer } from './AudioProvider'

interface Props {
  post: TPostDetail
  className?: string
}

function extractTextFromContent(content: TPostDetail['content']): string {
  if (!content) return ''
  if (typeof content === 'string') {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  // TipTap JSON content
  const extractText = (node: Record<string, unknown>): string => {
    if (node.type === 'text' && typeof node.text === 'string') return node.text
    if (Array.isArray(node.content)) {
      return (node.content as Record<string, unknown>[]).map(extractText).join(' ')
    }
    return ''
  }
  if (typeof content === 'object' && 'content' in content) {
    return extractText(content as Record<string, unknown>)
      .replace(/\s+/g, ' ')
      .trim()
  }
  return ''
}

const TextToSpeechButton: FC<Props> = ({ post, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ttsPostRef = useRef<TPostDetail | null>(null)
  const player = useAudioPlayer(ttsPostRef.current ?? undefined)

  const isTtsPlaying =
    ttsPostRef.current !== null && player.episode?.handle === ttsPostRef.current.handle && player.playing

  const handleClick = useCallback(async () => {
    setError(null)

    // If already loaded, toggle play/pause
    if (ttsPostRef.current) {
      player.toggle(ttsPostRef.current)
      return
    }

    // Extract text from DOM as fallback for rich content
    let text = extractTextFromContent(post.content)
    if (!text) {
      const el = document.getElementById('single-entry-content')
      text = el?.innerText?.trim() ?? post.title
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate audio')
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)

      const ttsPost: TPostDetail = { ...post, audioUrl, handle: `tts-${post.handle}` }
      ttsPostRef.current = ttsPost
      player.play(ttsPost)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
    } finally {
      setIsLoading(false)
    }
  }, [post, player])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        aria-label={isTtsPlaying ? 'Pause audio' : isLoading ? 'Generating audio…' : 'Listen to this post'}
      >
        {isLoading ? (
          <>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Generating…</span>
          </>
        ) : isTtsPlaying ? (
          <>
            <PauseIcon className="size-4" />
            <span>Pause</span>
          </>
        ) : ttsPostRef.current ? (
          <>
            <PlayIcon className="size-4 ms-0.5" />
            <span>Resume</span>
          </>
        ) : (
          <>
            <SpeakerWaveIcon className="size-4" />
            <span>Listen</span>
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export default TextToSpeechButton
