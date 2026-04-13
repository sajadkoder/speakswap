import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage } from '@/lib/language-detection'

const detectCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 40

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = detectCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    detectCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_LIMIT_MAX
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (text.trim().length < 3) {
      return NextResponse.json({ error: 'Text too short for language detection' }, { status: 400 })
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }

    const result = await detectLanguage(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Language detection failed' }, { status: 500 })
  }
}
