import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage } from '@/lib/language-detection'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (text.trim().length < 3) {
      return NextResponse.json({ error: 'Text too short for language detection' }, { status: 400 })
    }

    const result = await detectLanguage(text)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Language detection error:', error)
    return NextResponse.json({ error: 'Language detection failed' }, { status: 500 })
  }
}
