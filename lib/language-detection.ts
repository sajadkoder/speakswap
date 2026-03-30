export interface DetectionResult {
  confidence: number
  language: string
  source: string
}

const LATIN_LANGUAGE_HINTS: Record<string, string[]> = {
  de: ['der', 'die', 'und', 'nicht', 'ist', 'mit', 'ich', 'sie', 'ein', 'das'],
  en: ['the', 'and', 'is', 'are', 'with', 'you', 'that', 'for', 'have', 'this'],
  es: ['el', 'la', 'de', 'que', 'y', 'en', 'no', 'por', 'con', 'para'],
  fr: ['le', 'la', 'de', 'et', 'les', 'des', 'est', 'une', 'pour', 'avec'],
  it: ['il', 'la', 'di', 'che', 'e', 'non', 'per', 'una', 'con', 'sono'],
  pt: ['o', 'a', 'de', 'que', 'e', 'nao', 'para', 'com', 'uma', 'por'],
}

const SCRIPT_DETECTORS = [
  { language: 'ja', pattern: /[\u3040-\u30ff]/g, confidence: 0.96, threshold: 0.05 },
  { language: 'ko', pattern: /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/g, confidence: 0.96, threshold: 0.05 },
  { language: 'ar', pattern: /[\u0600-\u06ff]/g, confidence: 0.96, threshold: 0.05 },
  { language: 'hi', pattern: /[\u0900-\u097f]/g, confidence: 0.96, threshold: 0.05 },
  { language: 'ru', pattern: /[\u0400-\u04ff]/g, confidence: 0.96, threshold: 0.05 },
]

function getCharacterScore(text: string, pattern: RegExp): number {
  const matches = text.match(pattern)
  return matches ? matches.length / Math.max(Array.from(text).length, 1) : 0
}

function normalizeLatinText(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function detectLanguageSimple(text: string): DetectionResult {
  for (const detector of SCRIPT_DETECTORS) {
    const score = getCharacterScore(text, detector.pattern)
    if (score >= detector.threshold) {
      return {
        language: detector.language,
        confidence: Math.min(detector.confidence, 0.75 + score),
        source: 'Heuristic fallback',
      }
    }
  }

  const hanScore = getCharacterScore(text, /[\u4e00-\u9fff]/g)
  if (hanScore >= 0.1) {
    return {
      language: 'zh',
      confidence: Math.min(0.92, 0.7 + hanScore),
      source: 'Heuristic fallback',
    }
  }

  const words = normalizeLatinText(text)
  if (words.length === 0) {
    return { language: 'en', confidence: 0.5, source: 'Heuristic fallback' }
  }

  const uniqueWords = new Set(words)
  let bestLanguage = 'en'
  let bestScore = 0

  for (const [language, hints] of Object.entries(LATIN_LANGUAGE_HINTS)) {
    const score = hints.filter((hint) => uniqueWords.has(hint)).length / Math.min(words.length, 12)
    if (score > bestScore) {
      bestLanguage = language
      bestScore = score
    }
  }

  if (bestScore === 0) {
    return { language: 'en', confidence: 0.5, source: 'Heuristic fallback' }
  }

  return {
    language: bestLanguage,
    confidence: Math.min(0.95, 0.45 + bestScore),
    source: 'Heuristic fallback',
  }
}

export async function detectLanguageWithGoogle(text: string, timeoutMs = 5000): Promise<DetectionResult | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`
    const response = await fetch(googleUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (Array.isArray(data) && typeof data[2] === 'string') {
      return {
        language: data[2],
        confidence: 0.9,
        source: 'Google Translate',
      }
    }

    return null
  } catch (error) {
    console.log('Google language detection failed:', error)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function detectLanguage(text: string): Promise<DetectionResult> {
  const googleDetection = await detectLanguageWithGoogle(text)
  if (googleDetection) {
    return googleDetection
  }

  return detectLanguageSimple(text)
}
