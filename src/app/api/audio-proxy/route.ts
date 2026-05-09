import { NextRequest } from 'next/server'

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

  if (!url.startsWith('https://') || !url.includes('blob.vercel-storage.com')) {
    return new Response('Invalid url', { status: 400 })
  }

  const rangeHeader = request.headers.get('range')

  // For range requests that don't start at byte 0, proxy directly — no Xing fix needed
  if (rangeHeader) {
    const rangeStart = parseInt(rangeHeader.replace(/bytes=(\d+)-.*/, '$1') || '0', 10)
    if (rangeStart > 4096) {
      const upstream = await fetch(url, { headers: { Range: rangeHeader } })
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Range': upstream.headers.get('content-range') ?? '',
          'Content-Length': upstream.headers.get('content-length') ?? '',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  }

  // Full file or range starting near byte 0 — fetch and apply Xing fix to first 4KB
  const upstream = await fetch(url, rangeHeader ? { headers: { Range: rangeHeader } } : {})
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

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'Access-Control-Allow-Origin': '*',
  }
  if (upstream.headers.get('content-length')) {
    responseHeaders['Content-Length'] = upstream.headers.get('content-length')!
  }
  if (upstream.headers.get('content-range')) {
    responseHeaders['Content-Range'] = upstream.headers.get('content-range')!
  }

  return new Response(stream, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
