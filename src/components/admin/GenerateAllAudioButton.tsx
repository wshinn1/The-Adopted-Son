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
  chunk: number
  totalChunks: number
  error?: string
}

interface Props {
  devotionals: Devotional[]
}

async function generateWithProgress(
  devotionalId: string,
  forceRegenerate: boolean,
  onProgress: (chunk: number, total: number) => void,
  onUploading: () => void,
): Promise<string> {
  const res = await fetch('/api/admin/tts-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devotionalId, forceRegenerate }),
  })

  if (!res.body) throw new Error('No response stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let audioUrl = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'progress') onProgress(event.chunk, event.total)
        if (event.type === 'uploading') onUploading()
        if (event.type === 'done') audioUrl = event.audioUrl
        if (event.type === 'error') throw new Error(event.message)
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }

  if (!audioUrl) throw new Error('No audio URL returned')
  return audioUrl
}

export default function GenerateAllAudioButton({ devotionals }: Props) {
  const [running, setRunning] = useState(false)
  const [items, setItems] = useState<ItemState[]>([])
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<'missing' | 'all'>('missing')

  const missing = devotionals.filter((d) => !d.hasAudio)
  const missingCount = missing.length

  useEffect(() => {
    if (!running) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Audio is still generating. If you leave, the current devotional will need to be regenerated.'
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [running])

  const updateItem = useCallback((id: string, patch: Partial<ItemState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const run = useCallback(async (forceAll: boolean) => {
    const queue = forceAll ? devotionals : missing
    if (queue.length === 0) return

    const initial: ItemState[] = devotionals.map((d) => ({
      id: d.id,
      title: d.title,
      status: !forceAll && d.hasAudio ? 'skipped' : 'pending',
      chunk: 0,
      totalChunks: 0,
    }))
    setItems(initial)
    setRunning(true)
    setDone(false)

    for (const d of queue) {
      updateItem(d.id, { status: 'generating', chunk: 0, totalChunks: 0 })
      try {
        await generateWithProgress(
          d.id,
          forceAll,
          (chunk, total) => updateItem(d.id, { chunk, totalChunks: total }),
          () => updateItem(d.id, { chunk: -1 }), // -1 = uploading state
        )
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
  }, [devotionals, missing, updateItem])

  const completedItems = items.filter((i) => i.status === 'done' || i.status === 'error')
  const queueItems = items.filter((i) => i.status !== 'skipped')
  const overallPct = queueItems.length > 0
    ? Math.round((completedItems.length / queueItems.length) * 100)
    : 0

  if (devotionals.length === 0) return null

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
              ? `Generating ${completedItems.length} / ${queueItems.length}…`
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
            ? `Regenerating ${completedItems.length} / ${queueItems.length}…`
            : 'Regenerate All'}
        </button>
      </div>

      {/* Progress panel */}
      {(running || done) && items.length > 0 && (
        <div className="w-full sm:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-4 space-y-3">

          {/* Overall progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{running ? 'Overall progress' : 'Complete'}</span>
              <span>{overallPct}%</span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full transition-all duration-300"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            {done && (
              <p className="text-xs text-neutral-500">
                {items.filter(i => i.status === 'done').length} generated
                {items.filter(i => i.status === 'error').length > 0 && `, ${items.filter(i => i.status === 'error').length} failed`}
                {items.filter(i => i.status === 'skipped').length > 0 && `, ${items.filter(i => i.status === 'skipped').length} skipped`}
              </p>
            )}
          </div>

          {/* Item list */}
          <ul className="max-h-64 overflow-y-auto space-y-2 text-xs">
            {items.map((item) => {
              const isGenerating = item.status === 'generating'
              const chunkPct = isGenerating && item.totalChunks > 0
                ? item.chunk === -1
                  ? 100
                  : Math.round((item.chunk / item.totalChunks) * 100)
                : 0

              return (
                <li key={item.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-3.5 text-center">
                      {item.status === 'done'       && <span className="text-green-500">✓</span>}
                      {item.status === 'error'      && <span className="text-red-500">✕</span>}
                      {item.status === 'skipped'    && <span className="text-neutral-300 dark:text-neutral-600">–</span>}
                      {item.status === 'pending'    && <span className="text-neutral-300 dark:text-neutral-600">·</span>}
                      {isGenerating && (
                        <svg className="size-3 animate-spin text-neutral-500" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                    </span>
                    <span className={`truncate flex-1 ${
                      isGenerating           ? 'text-neutral-900 dark:text-neutral-100 font-medium' :
                      item.status === 'done' ? 'text-neutral-500 dark:text-neutral-400' :
                      item.status === 'error'? 'text-red-500' :
                      'text-neutral-300 dark:text-neutral-600'
                    }`}>
                      {item.title}
                    </span>
                    {isGenerating && item.totalChunks > 0 && (
                      <span className="shrink-0 text-neutral-400 tabular-nums">
                        {item.chunk === -1 ? 'Uploading…' : `${item.chunk} / ${item.totalChunks}`}
                      </span>
                    )}
                  </div>

                  {/* Per-item chunk progress bar */}
                  {isGenerating && item.totalChunks > 0 && (
                    <div className="ml-5 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-200"
                        style={{ width: `${chunkPct}%` }}
                      />
                    </div>
                  )}

                  {item.error && (
                    <p className="ml-5 text-red-400">{item.error}</p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
