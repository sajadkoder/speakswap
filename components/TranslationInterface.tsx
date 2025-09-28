"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  ArrowLeftRight,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface Language {
  code: string
  name: string
}

interface TranslationResponse {
  translatedText: string
  source?: string
  error?: string
}

export default function TranslationInterface() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('es')
  const [languages, setLanguages] = useState<Language[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  // Load languages on component mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch('/api/languages')
        const data = await response.json()
        setLanguages(data)
      } catch (error) {
        console.error('Failed to load languages:', error)
        // Fallback languages
        setLanguages([
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
        ])
      }
    }
    loadLanguages()
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = sourceLang

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setSourceText(transcript)
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        setError(`Speech recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognition)
    }
  }, [sourceLang])

  // Translate text when source text changes
  const translateText = useCallback(async (text: string) => {
    if (!text.trim() || sourceLang === targetLang) {
      setTranslatedText(sourceLang === targetLang ? text : '')
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang,
          targetLang,
        }),
      })

      const data: TranslationResponse = await response.json()
      
      if (data.error) {
        setError(data.error)
        setTranslatedText('')
      } else {
        setTranslatedText(data.translatedText)
      }
    } catch (error) {
      setError('Translation failed. Please try again.')
      setTranslatedText('')
    } finally {
      setIsTranslating(false)
    }
  }, [sourceLang, targetLang])

  // Debounced translation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (sourceText.trim()) {
        translateText(sourceText)
      } else {
        setTranslatedText('')
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [sourceText, translateText])

  // Speech synthesis
  const speakText = (text: string, lang: string) => {
    if (!text.trim()) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => {
      setIsSpeaking(false)
      setError('Speech synthesis failed')
    }

    window.speechSynthesis.speak(utterance)
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      setError('Failed to copy to clipboard')
    }
  }

  // Start/stop voice recording
  const toggleRecording = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    if (isListening) {
      recognition.stop()
    } else {
      recognition.lang = sourceLang
      recognition.start()
    }
  }

  // Swap languages
  const swapLanguages = () => {
    const tempLang = sourceLang
    const tempText = sourceText
    
    setSourceLang(targetLang)
    setTargetLang(tempLang)
    setSourceText(translatedText)
    setTranslatedText(tempText)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            SpeakSwap
          </h1>
          <p className="text-gray-600">Real-time voice translation</p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">From</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapLanguages}
              className="rounded-full"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">To</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Translation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Source Text</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleRecording}
                  className={`${isListening ? 'bg-red-50 border-red-200' : ''}`}
                  disabled={!recognition}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 text-red-600" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => speakText(sourceText, sourceLang)}
                  disabled={!sourceText.trim() || isSpeaking}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or speak to translate..."
              className="min-h-[200px] resize-none"
            />
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-2 text-red-600 text-sm"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                Listening...
              </motion.div>
            )}
          </div>

          {/* Translated Text */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Translation</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => speakText(translatedText, targetLang)}
                  disabled={!translatedText.trim() || isSpeaking}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(translatedText)}
                  disabled={!translatedText.trim()}
                >
                  {copyStatus === 'copied' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Textarea
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
                className="min-h-[200px] resize-none bg-gray-50"
              />
              {isTranslating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Translating...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Supports 60+ languages with real-time voice translation</p>
          <p className="mt-1">
            Migrated from Android app to web app for better accessibility
          </p>
        </div>
      </motion.div>
    </div>
  )
}
