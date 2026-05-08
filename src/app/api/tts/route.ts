import { supabaseAdmin } from '@/lib/supabase/admin'
import { put } from '@vercel/blob'
import { ElevenLabsClient } from 'elevenlabs'
import { NextRequest, NextResponse } from 'next/server'

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

export async function POST(request: NextRequest) {
  const { text, voiceId, devotionalId, forceRegenerate } = await request.json()

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
  }

  // Return cached audio URL if available and not forcing regeneration
  if (devotionalId && !forceRegenerate) {
    const { data } = await supabaseAdmin
      .from('devotionals')
      .select('tts_audio_url')
      .eq('id', devotionalId)
      .single()

    if (data?.tts_audio_url) {
      return NextResponse.json({ audioUrl: data.tts_audio_url })
    }
  }

  // Generate audio via ElevenLabs
  const resolvedVoiceId =
    (typeof voiceId === 'string' && voiceId.trim()) ||
    process.env.ELEVENLABS_VOICE_ID ||
    'JBFqnCBsd6RMkjVDRZzb'

  const audioStream = await client.textToSpeech.convert(resolvedVoiceId, {
    text: text.slice(0, 5000),
    model_id: 'eleven_multilingual_v2',
    output_format: 'mp3_44100_128',
  })

  const chunks: Buffer[] = []
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk))
  }
  const audioBuffer = Buffer.concat(chunks)

  // Upload to Vercel Blob and cache in Supabase
  if (devotionalId) {
    try {
      const { url } = await put(`tts/${devotionalId}.mp3`, audioBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
      })

      await supabaseAdmin
        .from('devotionals')
        .update({ tts_audio_url: url })
        .eq('id', devotionalId)

      return NextResponse.json({ audioUrl: url })
    } catch {
      // Fall through to streaming response if storage fails
    }
  }

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
