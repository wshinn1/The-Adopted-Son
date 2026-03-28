'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="shrink-0 text-xs px-2 py-1 rounded bg-primary-600 hover:bg-primary-700 text-white transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
