'use client'

import { upload } from '@vercel/blob/client'

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85

/**
 * Resize an image so its longest edge is at most MAX_DIMENSION pixels.
 * SVGs and already-small images are returned unchanged.
 * PNGs keep their format (preserves transparency); everything else → JPEG.
 */
async function resizeIfNeeded(file: File): Promise<File> {
  if (file.type === 'image/svg+xml') return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h, 1)

      if (scale === 1) {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const outputExt = outputType === 'image/png' ? 'png' : 'jpg'
      const outputName = file.name.replace(/\.[^.]+$/, `.${outputExt}`)
      const quality = outputType === 'image/jpeg' ? JPEG_QUALITY : undefined

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          resolve(new File([blob], outputName, { type: outputType }))
        },
        outputType,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image failed to load for resizing'))
    }

    img.src = objectUrl
  })
}

/**
 * Upload a file directly from the browser to Vercel Blob.
 * Images are resized to ≤1920px on the long edge before upload.
 * Returns the public URL of the uploaded file.
 */
export async function uploadMedia(file: File): Promise<string> {
  const processed = file.type.startsWith('image/') ? await resizeIfNeeded(file) : file
  const blob = await upload(`media/${processed.name}`, processed, {
    access: 'public',
    handleUploadUrl: '/api/media/upload-token',
  })
  return blob.url
}
