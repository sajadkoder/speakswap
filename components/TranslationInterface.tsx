"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Copy,
  Eraser,
  History,
  Languages,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTheme } from '@/components/ThemeProvider'
import { useDebounce, useKeyboardShortcut, useLocalStorage } from '@/lib/hooks'
import { categories, getPhrasesByLanguage } from '@/lib/phrases'
import { findBestVoice, getSpeechLocale } from '@/lib/speech'
import type { Language, TranslationResponse, HistoryItem } from '@/types'

const MAX_HISTORY = 50
const AUTO_LANGUAGE: Language = { code: 'auto', name: 'Auto Detect' }

const FALLBACK_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
]

function withAutoDetect(languages: Language[]): Language[] {
  return [AUTO_LANGUAGE, ...languages.filter((language) => language.code !== AUTO_LANGUAGE.code)]
}

function formatHistoryTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(timestamp)
}

export default function TranslationInterface() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('es')
  const [languages, setLanguages] = useState<Language[]>(() => withAutoDetect(FALLBACK_LANGUAGES))
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('translation-history', [])
  const [isListening, setIsListening] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [translationSource, setTranslationSource] = useState<string | null>(null)
  const [isAutoDetecting, setIsAutoDetecting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPhrases, setShowPhrases] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [autoSpeak, setAutoSpeak] = useState(true)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const debouncedSource = useDebounce(sourceText, 300)
  const translationAbortRef = useRef<AbortController | null>(null)
  const translationRequestRef = useRef(0)
  const lastInputMethodRef = useRef<'typing' | 'voice'>('typing')
  const lastSavedHistoryKeyRef = useRef('')
  const lastAutoSpokenKeyRef = useRef('')
  const skipNextHistorySaveRef = useRef(false)

  const effectiveSourceLang = sourceLang === 'auto' ? detectedLanguage ?? 'auto' : sourceLang
  const sourceLanguageName = useMemo(() => languages.find((language) => language.code === effectiveSourceLang)?.name ?? null, [effectiveSourceLang, languages])
  const targetLanguageName = useMemo(() => languages.find((language) => language.code === targetLang)?.name ?? targetLang.toUpperCase(), [languages, targetLang])
  const detectedLanguageName = useMemo(() => languages.find((language) => language.code === detectedLanguage)?.name ?? null, [detectedLanguage, languages])
  const listeningLocale = sourceLang === 'auto' ? (detectedLanguage ? getSpeechLocale(detectedLanguage) : null) : getSpeechLocale(sourceLang)
  const targetVoice = useMemo(() => findBestVoice(targetLang, availableVoices), [availableVoices, targetLang])
  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0
  const currentPhrases = useMemo(() => {
    const phraseLanguage = sourceLang === 'auto' ? detectedLanguage ?? 'en' : sourceLang
    const phrases = getPhrasesByLanguage(phraseLanguage)
    return selectedCategory === 'all' ? phrases.phrases : phrases.phrases.filter((phrase) => phrase.category === selectedCategory)
  }, [detectedLanguage, selectedCategory, sourceLang])

  const canRecord = Boolean(recognition)

  const recordHint = useMemo(() => {
    if (!recognition) {
      return 'Voice input is not available in this browser.'
    }
    if (sourceLang === 'auto' && !detectedLanguage) {
      return 'Type a few words first so the language can be detected, then use the microphone.'
    }
    return `Microphone input listens in ${sourceLanguageName ?? listeningLocale ?? 'English'}.`
  }, [listeningLocale, recognition, sourceLanguageName, sourceLang, detectedLanguage])

  const outputHint = targetVoice
    ? `Spoken output uses ${targetVoice.name}.`
    : `Spoken output will use the system voice for ${targetLanguageName}.`

  useEffect(() => {
    fetch('/api/languages')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load languages')
        }

        const availableLanguages = (await response.json()) as Language[]
        setLanguages(withAutoDetect(availableLanguages))
      })
      .catch(() => {
        setLanguages(withAutoDetect(FALLBACK_LANGUAGES))
      })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    const syncVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices())
    }

    syncVoices()
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', syncVoices)
    }
  }, [])

  const detectLanguage = useCallback(async (text: string) => {
    const trimmedText = text.trim()

    if (trimmedText.length < 3) {
      setDetectedLanguage(null)
      return null
    }

    if (detectedLanguage && trimmedText.length < 50) {
      return detectedLanguage
    }

    setIsAutoDetecting(true)

    try {
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText }),
      })
      const data = await response.json()

      if (response.ok && typeof data.language === 'string' && data.confidence > 0.65) {
        setDetectedLanguage(data.language)
        return data.language as string
      }

      setDetectedLanguage(null)
      return null
    } catch {
      return null
    } finally {
      setIsAutoDetecting(false)
    }
  }, [detectedLanguage])

  useEffect(() => {
    if (sourceLang !== 'auto') {
      setDetectedLanguage(null)
      setIsAutoDetecting(false)
      return
    }

    if (!debouncedSource.trim()) {
      setDetectedLanguage(null)
      setIsAutoDetecting(false)
      return
    }

    void detectLanguage(debouncedSource)
  }, [debouncedSource, detectLanguage, sourceLang])

  useEffect(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setRecognition(null)
      return
    }

    const RecognitionConstructor = window.webkitSpeechRecognition ?? window.SpeechRecognition
    if (!RecognitionConstructor) {
      setRecognition(null)
      return
    }

    const nextRecognition = new RecognitionConstructor()
    nextRecognition.continuous = true
    nextRecognition.interimResults = true
    nextRecognition.maxAlternatives = 1
    nextRecognition.lang = listeningLocale ?? getSpeechLocale('en')
    nextRecognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }
    nextRecognition.onresult = (event) => {
      let finalTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) {
          finalTranscript += `${result[0].transcript} `
        }
      }

      if (!finalTranscript.trim()) {
        return
      }

      lastInputMethodRef.current = 'voice'
      lastAutoSpokenKeyRef.current = ''
      const nextText = finalTranscript.trim()
      setSourceText((currentText) => (currentText.trim() ? `${currentText.trim()} ${nextText}` : nextText))
    }
    nextRecognition.onerror = (event) => {
      setIsListening(false)

      const messages: Record<string, string> = {
        'audio-capture': 'Microphone access is unavailable.',
        network: 'Speech recognition hit a network error.',
        'no-speech': 'No speech was detected.',
        'not-allowed': 'Microphone permission was denied.',
      }

      setError(messages[event.error] || `Speech recognition error: ${event.error}`)
    }
    nextRecognition.onend = () => setIsListening(false)

    setRecognition(nextRecognition)

    return () => {
      nextRecognition.onstart = null
      nextRecognition.onresult = null
      nextRecognition.onerror = null
      nextRecognition.onend = null
      nextRecognition.abort()
    }
  }, [listeningLocale])

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speakText = useCallback((text: string, languageCode: string) => {
    if (!text.trim()) {
      return false
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Spoken playback is not available in this browser.')
      return false
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = getSpeechLocale(languageCode)

    const preferredVoice = findBestVoice(languageCode, availableVoices)
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.rate = ['ja', 'ko', 'zh'].includes(languageCode) ? 0.9 : 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => {
      setIsSpeaking(false)
      setError(`This browser could not speak ${targetLanguageName}.`)
    }

    window.speechSynthesis.speak(utterance)
    return true
  }, [availableVoices, targetLanguageName])

  const translateText = useCallback(async (text: string) => {
    const trimmedText = text.trim()
    translationRequestRef.current += 1
    const requestId = translationRequestRef.current
    translationAbortRef.current?.abort()

    if (!trimmedText) {
      setTranslatedText('')
      setTranslationSource(null)
      setIsTranslating(false)
      setError(null)
      return
    }

    if (effectiveSourceLang !== 'auto' && effectiveSourceLang === targetLang) {
      setTranslatedText(trimmedText)
      setTranslationSource('Same language')
      setIsTranslating(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    translationAbortRef.current = controller
    setIsTranslating(true)
    setError(null)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText, sourceLang: effectiveSourceLang, targetLang }),
        signal: controller.signal,
      })
      const data = (await response.json()) as TranslationResponse

      if (translationRequestRef.current !== requestId) {
        return
      }

      if (typeof data.detectedLanguage === 'string' && sourceLang === 'auto') {
        setDetectedLanguage(data.detectedLanguage)
      }

      if (!response.ok || data.error) {
        setError(data.error ?? 'Translation failed.')
        setTranslatedText('')
        setTranslationSource(data.source ?? null)
        return
      }

      setTranslatedText(data.translatedText ?? '')
      setTranslationSource(data.source ?? null)
    } catch (fetchError) {
      if (controller.signal.aborted || translationRequestRef.current !== requestId) {
        return
      }

      console.error(fetchError)
      setError('Translation failed.')
      setTranslatedText('')
      setTranslationSource(null)
    } finally {
      if (translationAbortRef.current === controller) {
        translationAbortRef.current = null
      }

      if (translationRequestRef.current === requestId) {
        setIsTranslating(false)
      }
    }
  }, [effectiveSourceLang, sourceLang, targetLang])

  useEffect(() => {
    if (!debouncedSource.trim()) {
      translationAbortRef.current?.abort()
      setIsTyping(false)
      setTranslatedText('')
      setTranslationSource(null)
      return
    }

    let isCurrent = true
    setIsTyping(true)

    void translateText(debouncedSource).finally(() => {
      if (isCurrent) {
        setIsTyping(false)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [debouncedSource, translateText])

  useEffect(() => {
    return () => {
      translationAbortRef.current?.abort()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (!sourceText.trim() || !translatedText.trim() || isTranslating) {
      return
    }

    if (skipNextHistorySaveRef.current) {
      skipNextHistorySaveRef.current = false
      return
    }

    const historySourceLang = sourceLang === 'auto' ? detectedLanguage ?? 'auto' : sourceLang
    const trimmedSourceText = sourceText.trim()
    const trimmedTranslatedText = translatedText.trim()
    const historyKey = `${trimmedSourceText}::${trimmedTranslatedText}::${historySourceLang}::${targetLang}`

    if (lastSavedHistoryKeyRef.current === historyKey) {
      return
    }

    lastSavedHistoryKeyRef.current = historyKey

    const item: HistoryItem = {
      id: Date.now().toString(),
      sourceLang: historySourceLang,
      sourceText: trimmedSourceText,
      targetLang,
      timestamp: Date.now(),
      translatedText: trimmedTranslatedText,
    }

    setHistory((previousHistory) =>
      [item, ...previousHistory.filter((entry) => entry.sourceText !== trimmedSourceText || entry.targetLang !== targetLang)].slice(0, MAX_HISTORY),
    )
  }, [detectedLanguage, isTranslating, setHistory, sourceLang, sourceText, targetLang, translatedText])

  useEffect(() => {
    lastAutoSpokenKeyRef.current = ''
  }, [sourceText, targetLang])

  useEffect(() => {
    if (!autoSpeak || lastInputMethodRef.current !== 'voice' || !translatedText.trim() || isTranslating) {
      return
    }

    const autoSpeakKey = `${targetLang}:${translatedText.trim()}`
    if (lastAutoSpokenKeyRef.current === autoSpeakKey) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (speakText(translatedText, targetLang)) {
        lastAutoSpokenKeyRef.current = autoSpeakKey
      }
    }, 120)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [autoSpeak, isTranslating, speakText, targetLang, translatedText])

  useKeyboardShortcut(
    'Enter',
    () => {
      if (sourceText.trim()) {
        void translateText(sourceText)
      }
    },
    { ctrl: true },
  )

  useKeyboardShortcut('Escape', () => {
    setShowHistory(false)
    setShowPhrases(false)
    setError(null)
  })

  const handleSourceChange = (value: string) => {
    lastInputMethodRef.current = 'typing'
    lastAutoSpokenKeyRef.current = ''
    setSourceText(value)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setError('Failed to copy the translation.')
    }
  }

  const toggleRecording = () => {
    if (!recognition) {
      setError('Voice input is not available in this browser.')
      return
    }

    if (isListening) {
      recognition.stop()
      return
    }

    const locale = listeningLocale ?? getSpeechLocale('en')

    try {
      recognition.lang = locale
      recognition.start()
    } catch {
      setError('Failed to start voice input.')
    }
  }

  const swapLanguages = () => {
    if (sourceLang === 'auto') {
      if (detectedLanguage) {
        setSourceLang(targetLang)
        setTargetLang(detectedLanguage)
      } else {
        setError('Detect a language first before swapping.')
        return
      }
    } else {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
    }

    lastInputMethodRef.current = 'typing'
    lastAutoSpokenKeyRef.current = ''
    setSourceText(translatedText)
    setTranslatedText(sourceText)
    setDetectedLanguage(null)
    setTranslationSource('Swapped locally')
  }

  const clearHistory = () => {
    if (showClearConfirm) {
      setHistory([])
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    skipNextHistorySaveRef.current = true
    lastInputMethodRef.current = 'typing'
    setSourceText(item.sourceText)
    setTranslatedText(item.translatedText)
    setSourceLang(item.sourceLang)
    setTargetLang(item.targetLang)
    setDetectedLanguage(item.sourceLang === 'auto' ? null : item.sourceLang)
    setTranslationSource('Loaded from history')
    setShowHistory(false)
  }

  const loadPhrase = (phrase: string) => {
    lastInputMethodRef.current = 'typing'
    setSourceText(phrase)
    setShowPhrases(false)
  }

  const clearSource = () => {
    lastInputMethodRef.current = 'typing'
    lastAutoSpokenKeyRef.current = ''
    translationAbortRef.current?.abort()
    setSourceText('')
    setTranslatedText('')
    setDetectedLanguage(null)
    setTranslationSource(null)
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-5 px-4 py-6 md:px-6 md:py-10">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glow-panel overflow-hidden rounded-[28px] px-5 py-6 md:px-7 md:py-7"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-[-0.02em] glow-text md:text-3xl">
                SpeakSwap
              </h1>
              <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                Voice translation without the noise. Speak, type, or paste — hear it back instantly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory((current) => !current)}
                className="soft-btn h-9 rounded-full px-3.5 text-xs font-medium"
              >
                <History className="mr-1.5 h-3.5 w-3.5" /> History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhrases((current) => !current)}
                className="soft-btn h-9 rounded-full px-3.5 text-xs font-medium"
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Phrases
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="soft-btn h-9 w-9 rounded-full"
              >
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5 md:grid-cols-3">
            <div className="glow-badge inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium">
              <Mic className="h-3.5 w-3.5" /> {recordHint}
            </div>
            <div className="glow-badge inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium">
              <Volume2 className="h-3.5 w-3.5" /> {outputHint}
            </div>
            <div className="glow-badge inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium">
              <Languages className="h-3.5 w-3.5" /> {translationSource ?? 'Ready'}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-3 rounded-2xl border border-red-500/10 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700 dark:border-red-400/10 dark:bg-red-400/[0.06] dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setError(null)} aria-label="Dismiss error">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glow-panel overflow-hidden rounded-[28px] p-4 md:p-5"
      >
        <div className="grid gap-3 md:grid-cols-[1fr,auto,1fr] md:items-end">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">From</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="select-input h-11 rounded-2xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>{language.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={swapLanguages}
            aria-label="Swap languages"
            className="glow-btn mx-auto h-11 w-11 rounded-full"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">To</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="select-input h-11 rounded-2xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {languages
                  .filter((language) => language.code !== AUTO_LANGUAGE.code)
                  .map((language) => (
                    <SelectItem key={language.code} value={language.code}>{language.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <section className="inner-panel flex min-h-[320px] flex-col rounded-[22px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Source</p>
                <h2 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white truncate">
                  {sourceLang === 'auto'
                    ? detectedLanguageName ? `Detected: ${detectedLanguageName}` : 'Type or pick a language for voice'
                    : sourceLanguageName ?? sourceLang.toUpperCase()}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" onClick={toggleRecording} disabled={!canRecord && !isListening}
                  aria-label={isListening ? 'Stop recording' : 'Start recording'}
                  className={`soft-btn h-10 w-10 rounded-full ${isListening ? '!border-sky-400/30 !text-sky-600 dark:!text-sky-300' : ''}`}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon"
                  onClick={() => (isSpeaking ? stopSpeaking() : speakText(sourceText, sourceLang === 'auto' ? detectedLanguage ?? 'en' : sourceLang))}
                  disabled={!sourceText.trim()} aria-label={isSpeaking ? 'Stop speaking source' : 'Speak source text'}
                  className="soft-btn h-10 w-10 rounded-full">
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={clearSource} disabled={!sourceText.trim()}
                  aria-label="Clear source text" className="soft-btn h-10 w-10 rounded-full">
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-4 flex-1">
              <Textarea value={sourceText} onChange={(event) => handleSourceChange(event.target.value)}
                placeholder="Type here, or choose the spoken language and start dictation."
                maxLength={5000} aria-label="Source text to translate"
                className="text-input h-full min-h-[200px] rounded-[18px] px-4 py-4 text-base leading-7 tracking-[-0.01em] shadow-none" />
              {(isTyping || isAutoDetecting || isTranslating) && (
                <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full glow-badge px-3 py-1 text-[11px] font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {isAutoDetecting ? 'Detecting' : isTranslating ? 'Translating' : 'Updating'}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span>{sourceText.length}/5000</span>
              </div>
              <Button size="sm" onClick={() => void translateText(sourceText)}
                disabled={!sourceText.trim() || isTranslating}
                className="glow-btn h-8 rounded-full px-4 text-xs font-medium">
                Translate
              </Button>
            </div>
          </section>

          <section className="inner-panel flex min-h-[320px] flex-col rounded-[22px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Translation</p>
                <h2 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white truncate">{targetLanguageName}</h2>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant={autoSpeak ? 'default' : 'outline'} size="sm"
                  onClick={() => setAutoSpeak((current) => !current)}
                  className={`h-10 rounded-full px-3.5 text-xs font-medium ${autoSpeak ? 'glow-btn' : 'soft-btn'}`}>
                  Auto speak
                </Button>
                <Button variant="outline" size="icon"
                  onClick={() => (isSpeaking ? stopSpeaking() : speakText(translatedText, targetLang))}
                  disabled={!translatedText.trim()} aria-label={isSpeaking ? 'Stop speaking translation' : 'Speak translation'}
                  className="soft-btn h-10 w-10 rounded-full">
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(translatedText)}
                  disabled={!translatedText.trim()} aria-label="Copy translation"
                  className="soft-btn h-10 w-10 rounded-full">
                  {copyStatus === 'copied' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex-1">
              <Textarea value={translatedText} readOnly placeholder="Your translation appears here."
                aria-label="Translated text"
                className="text-input h-full min-h-[200px] rounded-[18px] px-4 py-4 text-base leading-7 tracking-[-0.01em] shadow-none" />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{translationSource ?? 'Live translation'}</span>
              <span>{autoSpeak ? 'Auto-speak on' : 'Auto-speak off'}</span>
            </div>
          </section>
        </div>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-2">
        <AnimatePresence initial={false}>
          {showHistory && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="glow-panel rounded-[22px] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">History</p>
                  <h3 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white">Recent</h3>
                </div>
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearHistory}
                    className="soft-btn h-9 rounded-full px-4 text-xs font-medium">
                    {showClearConfirm ? 'Confirm?' : 'Clear'}
                  </Button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {history.length === 0 ? (
                  <p className="rounded-[16px] bg-black/[0.02] px-4 py-4 text-sm text-slate-500 dark:bg-white/[0.02] dark:text-slate-400">
                    Translations you make will appear here.
                  </p>
                ) : (
                  history.slice(0, 8).map((item) => (
                    <button key={item.id} type="button" onClick={() => loadFromHistory(item)}
                      className="soft-btn w-full rounded-[16px] px-4 py-3.5 text-left transition-all hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.sourceText}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.translatedText}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-400">{formatHistoryTime(item.timestamp)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showPhrases && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="glow-panel rounded-[22px] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Quick Phrases</p>
                <h3 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white">Travel & everyday</h3>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={`h-8 rounded-full px-3 text-xs font-medium ${selectedCategory === 'all' ? 'glow-btn' : 'soft-btn'}`}>
                  All
                </Button>
                {categories.map((category) => (
                  <Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`h-8 rounded-full px-3 text-xs font-medium ${selectedCategory === category ? 'glow-btn' : 'soft-btn'}`}>
                    {category}
                  </Button>
                ))}
              </div>

              <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {currentPhrases.map((phrase, index) => (
                  <button key={`${phrase.text}-${index}`} type="button" onClick={() => loadPhrase(phrase.text)}
                    className="soft-btn rounded-[14px] px-3.5 py-3 text-left text-sm text-slate-900 transition-all hover:shadow-sm dark:text-white">
                    {phrase.text}
                  </button>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
