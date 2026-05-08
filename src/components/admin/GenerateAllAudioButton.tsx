'use client'

import { useState, useCallback, useEffect } from 'react'

interface Devotional {
  id: string
  title: string
  hasAudio: boolean
}

type ItemStatus = 'pending' | 'skipped' | 'generating' | 'done' | 'error'

interface ItemState {
  id: string
  title: string
  status: ItemStatus
  error?: string
}

interface Props {
  devotionals: Devotional[]
}

export default function GenerateAllAudioButton({ devotionals }: Props) {
  const [running, setRunning] = useState(false)
  const [items, setItems] = useState<ItemState[]>([])
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<'missing' | 'all'>('missing')

  useEffect(() => {
    if (!running) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Audio is still generating. If you leave, progress will be lost for the current devotional.'
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [running])

  const missing = devotionals.filter((d) => !d.hasAudio)
  const allCount = devotionals.length
  const missingCount = missing.length

  const updateItem = (id: string, patch: Partial<ItemState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const run = useCallback(
    async (forceAll: boolean) => {
      const queue = forceAll ? devotionals : missing
      if (queue.length === 0) return

      const initial: ItemState[] = devotionals.map((d) => ({
        id: d.id,
        title: d.title,
        status: !forceAll && d.hasAudio ? 'skipped' : 'pending',
      }))
      setItems(initial)
      setRunning(true)
      setDone(false)

      for (const d of queue) {
        updateItem(d.id, { status: 'generating' })
        try {
          const res = await fetch('/api/admin/tts-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ devotionalId: d.id, forceRegenerate: forceAll }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.error || 'failed')
          updateItem(d.id, { status: 'done' })
        } catch (err) {
          updateItem(d.id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'failed',
          })
        }
      }

      setRunning(false)
      setDone(true)
    },
    [devotionals, missing]
  )

  const doneCount = items.filter((i) => i.status === 'done').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const total = items.filter((i) => i.status !== 'skipped').length
  const processed = items.filter((i) => i.status === 'done' || i.status === 'error').length
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0

  if (allCount === 0) return null

  return (
    <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {missingCount > 0 && (
          <button
            type="button"
            onClick={() => { setMode('missing'); run(false) }}
            disabled={running}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {running && mode === 'missing'
              ? `Generating ${processed} / ${total}…`
              : `Generate Missing (${missingCount})`}
          </button>
        )}
        {missingCount === 0 && !running && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ All audio ready</span>
        )}
        <button
          type="button"
          onClick={() => { setMode('all'); run(true) }}
          disabled={running}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {running && mode === 'all'
            ? `Regenerating ${processed} / ${total}…`
            : 'Regenerate All'}
        </button>
      </div>

      {/* Progress panel */}
      {(running || done) && items.length > 0 && (
        <div className="w-full sm:w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-4 space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{running ? 'Generating…' : done ? 'Complete' : ''}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {done && (
              <p className="text-xs text-neutral-500">
                {doneCount} generated{errorCount > 0 ? `, ${errorCount} failed` : ''}
                {items.filter(i => i.status === 'skipped').length > 0
                  ? `, ${items.filter(i => i.status === 'skipped').length} skipped`
                  : ''}
              </p>
            )}
          </div>

          {/* Item list */}
          <ul className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">
                  {item.status === 'done'      && <span className="text-green-500">✓</span>}
                  {item.status === 'error'     && <span className="text-red-500">✕</span>}
                  {item.status === 'skipped'   && <span className="text-neutral-300 dark:text-neutral-600">–</span>}
                  {item.status === 'generating' && (
                    <svg className="size-3 animate-spin text-neutral-500 mt-0.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {item.status === 'pending'   && <span className="text-neutral-300 dark:text-neutral-600">·</span>}
                </span>
                <span className={`truncate ${
                  item.status === 'generating' ? 'text-neutral-900 dark:text-neutral-100 font-medium' :
                  item.status === 'done'       ? 'text-neutral-600 dark:text-neutral-400' :
                  item.status === 'error'      ? 'text-red-500' :
                  'text-neutral-400'
                }`}>
                  {item.title}
                  {item.error && <span className="ml-1 text-red-400">— {item.error}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
