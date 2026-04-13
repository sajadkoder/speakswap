export interface Language {
  code: string
  name: string
}

export interface TranslationResponse {
  detectedLanguage?: string
  error?: string
  source?: string
  translatedText?: string
}

export interface HistoryItem {
  id: string
  sourceLang: string
  sourceText: string
  targetLang: string
  timestamp: number
  translatedText: string
}
