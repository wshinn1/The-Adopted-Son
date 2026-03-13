import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormAdmin, sendContactFormConfirmation } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Send both emails concurrently
    await Promise.all([
      sendContactFormAdmin({ name, email, message }),
      sendContactFormConfirmation({ name, email }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[contact] Error:', error)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
