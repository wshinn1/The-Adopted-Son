'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export default function AdminMediaUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('altText', file.name)

    await fetch('/api/media/upload', { method: 'POST', body: formData })
    setUploading(false)
    router.refresh()
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={handleUpload} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : '+ Upload'}
      </button>
    </>
  )
}
