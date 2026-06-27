import { supabaseAdmin } from '@/lib/supabase/admin'
import { put } from '@vercel/blob'
import { ElevenLabsClient } from 'elevenlabs'
import { NextRequest } from 'next/server'

export const maxDuration = 300

const CHUNK_SIZE = 5000
const PARALLEL = 2
const MAX_RETRIES = 4

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) return (n.content as unknown[]).map(extractText).join(' ')
  return ''
}

function contentToText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  return extractText(content).replace(/\s+/g, ' ').trim()
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= size) {
      chunks.push(remaining)
      break
    }
    let splitAt = size
    const window = remaining.slice(0, size)
    const lastPeriod = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf('! '),
      window.lastIndexOf('? '),
      window.lastIndexOf('\n'),
    )
    if (lastPeriod > size * 0.5) splitAt = lastPeriod + 1
    chunks.push(remaining.slice(0, splitAt).trim())
    remaining = remaining.slice(splitAt).trim()
  }

  return chunks.filter(Boolean)
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /status code:?\s*429/i.test(message)
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateChunk(text: string, voiceId: string): Promise<Buffer> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = await elevenlabs.textToSpeech.convert(voiceId, {
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
      })
      const chunks: Buffer[] = []
      for await (const chunk of stream) chunks.push(Buffer.from(chunk))
      return Buffer.concat(chunks)
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES
      if (!isRateLimitError(err) || isLastAttempt) throw err
      // Rate-limited by ElevenLabs (e.g. concurrent-request cap for the account's plan) — back off and retry
      await sleep(2000 * Math.pow(2, attempt))
    }
  }
  throw new Error('Unreachable')
}

function send(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!process.env.ELEVENLABS_API_KEY) {
          send(controller, encoder, { type: 'error', message: 'ElevenLabs API key not configured' })
          controller.close()
          return
        }

        const { devotionalId, forceRegenerate } = await request.json()

        if (!devotionalId) {
          send(controller, encoder, { type: 'error', message: 'devotionalId is required' })
          controller.close()
          return
        }

        const { data: devotional, error } = await supabaseAdmin
          .from('devotionals')
          .select('id, title, content')
          .eq('id', devotionalId)
          .single()

        if (error || !devotional) {
          send(controller, encoder, { type: 'error', message: 'Devotional not found' })
          controller.close()
          return
        }

        const text = contentToText(devotional.content)
        if (!text) {
          send(controller, encoder, { type: 'error', message: 'No text content found' })
          controller.close()
          return
        }

        const { data: settings } = await supabaseAdmin
          .from('site_settings')
          .select('value')
          .eq('key', 'elevenlabs_voice_id')
          .single()

        const voiceId =
          (settings?.value && typeof settings.value === 'string' && settings.value.replace(/^"|"$/g, '')) ||
          process.env.ELEVENLABS_VOICE_ID ||
          'JBFqnCBsd6RMkjVDRZzb'

        const chunks = chunkText(text, CHUNK_SIZE)
        const total = chunks.length

        send(controller, encoder, { type: 'start', total })

        const audioBuffers: Buffer[] = new Array(chunks.length)
        let completed = 0

        for (let batchStart = 0; batchStart < chunks.length; batchStart += PARALLEL) {
          const batchEnd = Math.min(batchStart + PARALLEL, chunks.length)
          const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, k) => batchStart + k)

          await Promise.all(
            batchIndices.map(async (i) => {
              audioBuffers[i] = await generateChunk(chunks[i], voiceId)
              completed++
              send(controller, encoder, { type: 'progress', chunk: completed, total })
            })
          )
        }

        const combined = Buffer.concat(audioBuffers)

        send(controller, encoder, { type: 'uploading' })

        const { url } = await put(`tts/${devotionalId}.mp3`, combined, {
          access: 'public',
          contentType: 'audio/mpeg',
          addRandomSuffix: false,
        })

        await supabaseAdmin
          .from('devotionals')
          .update({ tts_audio_url: url })
          .eq('id', devotionalId)

        send(controller, encoder, { type: 'done', audioUrl: url, chunks: total })
      } catch (err) {
        send(controller, encoder, {
          type: 'error',
          message: err instanceof Error ? err.message : 'Generation failed',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
