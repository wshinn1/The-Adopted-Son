import { NextRequest } from 'next/server'

// Neutralize Xing/LAME VBR header so mobile browsers scan real frames for duration
function neutralizeXingHeader(bytes: Uint8Array): void {
  let offset = 0
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size =
      ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7)  |  (bytes[9] & 0x7f)
    offset = 10 + size
  }
  const end = Math.min(offset + 2048, bytes.length - 4)
  for (let i = offset; i < end; i++) {
    if (
      (bytes[i] === 0x58 && bytes[i+1] === 0x69 && bytes[i+2] === 0x6e && bytes[i+3] === 0x67) ||
      (bytes[i] === 0x49 && bytes[i+1] === 0x6e && bytes[i+2] === 0x66 && bytes[i+3] === 0x6f)
    ) {
      bytes[i] = 0; bytes[i+1] = 0; bytes[i+2] = 0; bytes[i+3] = 0
      return
    }
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new Response('Missing url param', { status: 400 })

  // Only allow Vercel Blob URLs
  if (!url.startsWith('https://') || !url.includes('blob.vercel-storage.com')) {
    return new Response('Invalid url', { status: 400 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to fetch audio', { status: 502 })
  }

  const reader = upstream.body.getReader()
  const HEADER_WINDOW = 4096
  const headerChunks: Uint8Array[] = []
  let headerBytesRead = 0
  let headerFixed = false

  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Flush remaining buffered header bytes if file was tiny
          if (!headerFixed && headerChunks.length > 0) {
            const combined = new Uint8Array(headerBytesRead)
            let off = 0
            for (const c of headerChunks) { combined.set(c, off); off += c.length }
            neutralizeXingHeader(combined)
            controller.enqueue(combined)
          }
          controller.close()
          return
        }

        if (headerFixed) {
          controller.enqueue(value)
          return
        }

        headerChunks.push(value)
        headerBytesRead += value.length

        if (headerBytesRead >= HEADER_WINDOW) {
          const combined = new Uint8Array(headerBytesRead)
          let off = 0
          for (const c of headerChunks) { combined.set(c, off); off += c.length }
          neutralizeXingHeader(combined)
          controller.enqueue(combined)
          headerFixed = true
          return
        }
      }
    },
    cancel() { reader.cancel() },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      // Forward Content-Length so browsers can calculate duration and enable seeking
      ...(upstream.headers.get('content-length')
        ? { 'Content-Length': upstream.headers.get('content-length')! }
        : {}),
    },
  })
}
