'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  devotionalId: string
  slug: string
}

export default function AdminDevotionalActions({ devotionalId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this devotional? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/admin/devotionals/${devotionalId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {deleting ? '...' : 'Delete'}
    </button>
  )
}
