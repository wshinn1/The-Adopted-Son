'use client'

import { useState, useCallback } from 'react'

interface Devotional {
  id: string
  title: string
}

interface Props {
  devotionalsWithoutAudio: Devotional[]
}

export default function GenerateAllAudioButton({ devotionalsWithoutAudio }: Props) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const handleClick = useCallback(async () => {
    if (devotionalsWithoutAudio.length === 0) return
    setRunning(true)
    setDone(false)
    setErrors([])
    const total = devotionalsWithoutAudio.length
    const errs: string[] = []

    for (let i = 0; i < devotionalsWithoutAudio.length; i++) {
      const d = devotionalsWithoutAudio[i]
      setProgress({ done: i, total, current: d.title })

      try {
        const res = await fetch('/api/admin/tts-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ devotionalId: d.id }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          errs.push(`"${d.title}": ${data.error || 'failed'}`)
        }
      } catch {
        errs.push(`"${d.title}": network error`)
      }
    }

    setProgress({ done: total, total, current: '' })
    setErrors(errs)
    setRunning(false)
    setDone(true)
  }, [devotionalsWithoutAudio])

  if (devotionalsWithoutAudio.length === 0 && !done) {
    return (
      <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ All audio generated</span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={running}
        className="px-4 py-2 text-sm font-medium rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {running
          ? `Generating ${progress ? progress.done + 1 : 1} / ${progress?.total ?? devotionalsWithoutAudio.length}…`
          : done
          ? 'Generate Again'
          : `Generate Audio (${devotionalsWithoutAudio.length} missing)`}
      </button>

      {running && progress && (
        <p className="text-xs text-neutral-500 max-w-[260px] truncate text-right">
          {progress.current}
        </p>
      )}

      {done && errors.length === 0 && (
        <p className="text-xs text-green-600 dark:text-green-400">✓ All done</p>
      )}

      {errors.length > 0 && (
        <ul className="text-xs text-red-500 space-y-0.5 text-right">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  )
}
