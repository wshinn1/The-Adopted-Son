'use client'

import { useState, useEffect } from 'react'

interface BackupManifest {
  timestamp: string
  tables: Record<string, { rows: number; success: boolean }>
  mediaFiles: number
  totalMediaRecords: number
}

interface BackupInfo {
  date: string
  manifest?: BackupManifest
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [runningBackup, setRunningBackup] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadBackups()
  }, [])

  async function loadBackups() {
    try {
      const res = await fetch('/api/admin/backups')
      if (res.ok) {
        const data = await res.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    } finally {
      setLoading(false)
    }
  }

  async function runManualBackup() {
    setRunningBackup(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/backups/run', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage('Backup completed successfully!')
        loadBackups()
      } else {
        setMessage(`Backup failed: ${data.error}`)
      }
    } catch (error) {
      setMessage('Backup failed: Network error')
    } finally {
      setRunningBackup(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Backups</h1>
          <p className="text-neutral-600 mt-1">
            Automatic backups run daily at midnight. Keep last 30 days.
          </p>
        </div>
        <button
          onClick={runManualBackup}
          disabled={runningBackup}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runningBackup ? 'Running...' : 'Run Backup Now'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold">Backup History</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-neutral-500">Loading...</div>
        ) : backups.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            No backups yet. Run your first backup above.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {backups.map((backup) => (
              <div key={backup.date} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-neutral-900">{backup.date}</h3>
                    {backup.manifest && (
                      <div className="mt-2 text-sm text-neutral-600 space-y-1">
                        <p>
                          Time: {new Date(backup.manifest.timestamp).toLocaleTimeString()}
                        </p>
                        <p>
                          Tables: {Object.keys(backup.manifest.tables).length} backed up
                        </p>
                        <p>
                          Media files: {backup.manifest.mediaFiles} of {backup.manifest.totalMediaRecords}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/admin/backups/download?date=${backup.date}`}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                    >
                      Download
                    </a>
                  </div>
                </div>

                {backup.manifest && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {Object.entries(backup.manifest.tables).map(([table, info]) => (
                      <div
                        key={table}
                        className={`px-2 py-1 text-xs rounded ${
                          info.success
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {table}: {info.rows} rows
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
