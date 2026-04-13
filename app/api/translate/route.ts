import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage } from '@/lib/language-detection'

type TranslationSource = 'mymemory' | 'libre' | 'google'

interface CachedTranslation {
  source: string
  timestamp: number
  translation: string
}

interface TranslationResult {
  detectedLanguage?: string
  source: string
  translatedText: string
}

const translationCache = new Map<string, CachedTranslation>()
const CACHE_DURATION = 5 * 60 * 1000
const MAX_CACHE_SIZE = 500

const VALID_LANG_CODES = /^[a-z]{2,3}(-[A-Z]{2})?$/

const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_LIMIT_MAX
}

const LANGUAGE_MAPPINGS: Record<string, Partial<Record<TranslationSource, string>>> = {
  ar: { google: 'ar', libre: 'ar', mymemory: 'ar' },
  pt: { google: 'pt', libre: 'pt', mymemory: 'pt-BR' },
  zh: { google: 'zh-cn', libre: 'zh', mymemory: 'zh-CN' },
}

function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${sourceLang}-${targetLang}-${text.toLowerCase().trim()}`
}

function getFromCache(key: string): CachedTranslation | null {
  const cached = translationCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached
  }
  translationCache.delete(key)
  return null
}

function setCache(key: string, translation: string, source: string) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    translationCache.forEach((value, k) => {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp
        oldestKey = k
      }
    })
    if (oldestKey) translationCache.delete(oldestKey)
  }
  translationCache.set(key, { source, timestamp: Date.now(), translation })
}

function mapLanguageCode(languageCode: string, api: TranslationSource): string {
  return LANGUAGE_MAPPINGS[languageCode]?.[api] || languageCode
}

function isValidLangCode(code: string): boolean {
  return code === 'auto' || VALID_LANG_CODES.test(code)
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function translateWithMyMemory(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult | null> {
  if (sourceLang === 'auto') return null

  const response = await fetchWithTimeout(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${mapLanguageCode(sourceLang, 'mymemory')}|${mapLanguageCode(targetLang, 'mymemory')}`,
    { method: 'GET', headers: { Accept: 'application/json', 'User-Agent': 'SpeakSwap/1.0' } },
    10000,
  )

  if (!response.ok) return null

  const data = await response.json()
  const translatedText = data?.responseData?.translatedText
  if (!translatedText || translatedText.toLowerCase() === text.toLowerCase()) return null

  return { source: 'MyMemory', translatedText }
}

async function translateWithLibre(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult | null> {
  if (sourceLang === 'auto') return null

  const endpoints = [
    'https://libretranslate.de/translate',
    'https://libretranslate.com/translate',
    'https://translate.argosopentech.com/translate',
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'SpeakSwap/1.0' },
        body: JSON.stringify({ format: 'text', q: text, source: mapLanguageCode(sourceLang, 'libre'), target: mapLanguageCode(targetLang, 'libre') }),
      }, 10000)

      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) continue

      const data = await response.json()
      if (data?.translatedText && data.translatedText.toLowerCase() !== text.toLowerCase()) {
        return { source: 'LibreTranslate', translatedText: data.translatedText }
      }
    } catch {
    }
  }

  return null
}

async function translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult | null> {
  const response = await fetchWithTimeout(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === 'auto' ? 'auto' : mapLanguageCode(sourceLang, 'google')}&tl=${mapLanguageCode(targetLang, 'google')}&dt=t&q=${encodeURIComponent(text)}`,
    { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } },
    8000,
  )

  if (!response.ok) return null

  const data = await response.json()
  const segments = Array.isArray(data?.[0]) ? (data[0] as Array<[string]>).map((item) => item[0]).join('') : ''
  if (!segments || segments.toLowerCase() === text.toLowerCase()) return null

  return { source: 'Google Translate', translatedText: segments }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const { text, sourceLang, targetLang } = await request.json()
    const trimmedText = typeof text === 'string' ? text.trim() : ''

    if (!trimmedText || !sourceLang || !targetLang) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    if (!isValidLangCode(sourceLang) || !isValidLangCode(targetLang)) {
      return NextResponse.json({ error: 'Invalid language code' }, { status: 400 })
    }

    if (trimmedText.length > 5000) {
      return NextResponse.json({ error: 'Text too long. Maximum 5000 characters.' }, { status: 400 })
    }

    let resolvedSourceLang = sourceLang
    let detectionSource: string | null = null

    if (sourceLang === 'auto') {
      const detectionResult = await detectLanguage(trimmedText)
      resolvedSourceLang = detectionResult.language
      detectionSource = detectionResult.source
    }

    if (resolvedSourceLang === targetLang) {
      return NextResponse.json({
        translatedText: trimmedText,
        source: detectionSource ? `${detectionSource} (same language)` : 'Same language',
        ...(sourceLang === 'auto' ? { detectedLanguage: resolvedSourceLang } : {}),
      })
    }

    const cacheKey = getCacheKey(trimmedText, sourceLang, targetLang)
    const cached = getFromCache(cacheKey)
    if (cached) {
      return NextResponse.json({
        translatedText: cached.translation,
        source: `${cached.source} (cached)`,
        ...(sourceLang === 'auto' ? { detectedLanguage: resolvedSourceLang } : {}),
      })
    }

    const strategies =
      sourceLang === 'auto'
        ? [
            () => translateWithGoogle(trimmedText, sourceLang, targetLang),
            () => translateWithMyMemory(trimmedText, resolvedSourceLang, targetLang),
            () => translateWithLibre(trimmedText, resolvedSourceLang, targetLang),
          ]
        : [
            () => translateWithMyMemory(trimmedText, resolvedSourceLang, targetLang),
            () => translateWithLibre(trimmedText, resolvedSourceLang, targetLang),
            () => translateWithGoogle(trimmedText, resolvedSourceLang, targetLang),
          ]

    for (const strategy of strategies) {
      try {
        const result = await strategy()
        if (!result) continue

        setCache(cacheKey, result.translatedText, result.source)
        return NextResponse.json({
          ...result,
          ...(sourceLang === 'auto' ? { detectedLanguage: resolvedSourceLang } : {}),
        })
      } catch {
      }
    }

    return NextResponse.json(
      {
        error: 'All translation services are temporarily unavailable. Please try again later.',
        source: 'Error',
        ...(sourceLang === 'auto' ? { detectedLanguage: resolvedSourceLang } : {}),
      },
      { status: 503 },
    )
  } catch {
    return NextResponse.json({ error: 'Translation failed. Please try again.' }, { status: 500 })
  }
}
