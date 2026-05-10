'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { uploadMedia } from '@/lib/uploadMedia'

export default function AdminMediaUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadMedia(file)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error uploading file')
    } finally {
      setUploading(false)
      router.refresh()
    }
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
