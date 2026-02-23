"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  ArrowLeftRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  History,
  Star,
  StarOff,
  Trash2,
  X,
  MessageSquare,
  ChevronDown,
  Languages,
  Eraser,
  Keyboard
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
import { useLocalStorage, useDebounce } from '@/lib/hooks'
import { useTheme } from '@/components/ThemeProvider'
import { commonPhrases, categories, getPhrasesByLanguage } from '@/lib/phrases'

interface Language {
  code: string
  name: string
}

interface TranslationResponse {
  translatedText: string
  source?: string
  error?: string
}

interface HistoryItem {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
  starred?: boolean
}

const MAX_HISTORY = 50

export default function TranslationInterface() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('es')
  const [languages, setLanguages] = useState<Language[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [isAutoDetecting, setIsAutoDetecting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPhrases, setShowPhrases] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('translation-history', [])
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isTyping, setIsTyping] = useState(false)
  const debouncedSource = useDebounce(sourceText, 300)

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch('/api/languages')
        const data = await response.json()
        setLanguages(data)
      } catch (error) {
        console.error('Failed to load languages:', error)
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
          { code: 'zh', name: 'Chinese (Simplified)' },
          { code: 'ar', name: 'Arabic' },
          { code: 'hi', name: 'Hindi' },
        ])
      }
    }
    loadLanguages()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 3
      recognition.lang = sourceLang === 'auto' ? 'en-US' : sourceLang

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          
          if (result.isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setSourceText(prev => prev + finalTranscript)
          if (sourceLang === 'auto') {
            detectLanguage(finalTranscript)
          }
        } else if (interimTranscript) {
          setSourceText(prev => {
            const words = prev.split(' ')
            words[words.length - 1] = interimTranscript
            return words.join(' ')
          })
        }
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        let errorMessage = 'Speech recognition error'
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.'
            break
          case 'not-allowed':
            errorMessage = 'Microphone permission denied.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }
        
        setError(errorMessage)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognition)
    }
  }, [sourceLang])

  const detectLanguage = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 10) return
    
    setIsAutoDetecting(true)
    try {
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      
      const data = await response.json()
      if (data.language && data.confidence > 0.7) {
        setDetectedLanguage(data.language)
        setSourceLang(data.language)
      }
    } catch (error) {
      console.error('Language detection failed:', error)
    } finally {
      setIsAutoDetecting(false)
    }
  }, [])

  const translateText = useCallback(async (text: string) => {
    if (!text.trim() || sourceLang === targetLang) {
      setTranslatedText(sourceLang === targetLang ? text : '')
      return
    }

    if (sourceLang === 'auto' && text.length >= 10) {
      await detectLanguage(text)
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
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
  }, [sourceLang, targetLang, detectLanguage])

  useEffect(() => {
    if (debouncedSource.trim()) {
      setIsTyping(true)
      translateText(debouncedSource).finally(() => setIsTyping(false))
    } else {
      setTranslatedText('')
    }
  }, [debouncedSource, translateText])

  useEffect(() => {
    if (sourceText.trim() && translatedText.trim() && !isTranslating) {
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        sourceText: sourceText.trim(),
        translatedText: translatedText.trim(),
        sourceLang,
        targetLang,
        timestamp: Date.now(),
        starred: false,
      }
      
      setHistory(prev => {
        const filtered = prev.filter(item => 
          item.sourceText !== sourceText.trim() || item.targetLang !== targetLang
        )
        return [newHistoryItem, ...filtered].slice(0, MAX_HISTORY)
      })
    }
  }, [translatedText, isTranslating, sourceLang, targetLang, sourceText, setHistory])

  const speakText = (text: string, lang: string) => {
    if (!text.trim()) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    const languageMap: { [key: string]: string } = {
      'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
      'it': 'it-IT', 'pt': 'pt-BR', 'ru': 'ru-RU', 'ja': 'ja-JP',
      'ko': 'ko-KR', 'zh': 'zh-CN', 'ar': 'ar-SA', 'hi': 'hi-IN',
    }
    
    utterance.lang = languageMap[lang] || lang
    
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(lang) || voice.lang.startsWith(languageMap[lang] || lang)
    )
    
    if (preferredVoice) utterance.voice = preferredVoice
    
    utterance.rate = ['ja', 'ko', 'zh'].includes(lang) ? 0.8 : 0.9
    utterance.pitch = 1
    utterance.volume = 0.9

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const toggleRecording = () => {
    if (!recognition) {
      setError('Speech recognition not supported')
      return
    }

    if (isListening) {
      recognition.stop()
    } else {
      try {
        recognition.lang = sourceLang === 'auto' ? 'en-US' : sourceLang
        if (navigator.permissions) {
          navigator.permissions.query({ name: 'microphone' as PermissionName })
            .then(status => {
              if (status.state === 'denied') {
                setError('Microphone permission denied')
                return
              }
              recognition.start()
            })
            .catch(() => recognition.start())
        } else {
          recognition.start()
        }
      } catch {
        setError('Failed to start speech recognition')
      }
    }
  }

  const swapLanguages = () => {
    if (sourceLang === 'auto') return
    const tempLang = sourceLang
    const tempText = sourceText
    
    setSourceLang(targetLang)
    setTargetLang(tempLang)
    setSourceText(translatedText)
    setTranslatedText(tempText)
  }

  const toggleStar = (id: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, starred: !item.starred } : item
    ))
  }

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
  }

  const loadFromHistory = (item: HistoryItem) => {
    setSourceText(item.sourceText)
    setTranslatedText(item.translatedText)
    setSourceLang(item.sourceLang)
    setTargetLang(item.targetLang)
    setShowHistory(false)
  }

  const loadPhrase = (phrase: string) => {
    setSourceText(phrase)
    setShowPhrases(false)
  }

  const clearSource = () => {
    setSourceText('')
    setTranslatedText('')
    setError(null)
  }

  const currentPhrases = useMemo(() => {
    const phrases = getPhrasesByLanguage(sourceLang === 'auto' ? 'en' : sourceLang)
    if (selectedCategory === 'all') return phrases.phrases
    return phrases.phrases.filter(p => p.category === selectedCategory)
  }, [sourceLang, selectedCategory])

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0
  const charCount = sourceText.length

  const favoriteItems = history.filter(item => item.starred)

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient">
              SpeakSwap
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Real-time voice translation • 70+ languages
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="relative"
              title="Translation History"
            >
              <History className="h-5 w-5" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {history.length > 9 ? '9+' : history.length}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPhrases(!showPhrases)}
              title="Common Phrases"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Translation History
                  {favoriteItems.length > 0 && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                      {favoriteItems.length} starred
                    </span>
                  )}
                </h3>
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 text-sm">
                    No translation history yet
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {history.slice(0, 20).map(item => (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group flex items-start justify-between gap-2"
                        onClick={() => loadFromHistory(item)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.sourceText}</p>
                          <p className="text-xs text-slate-500 truncate">{item.translatedText}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {languages.find(l => l.code === item.sourceLang)?.name || item.sourceLang} → {languages.find(l => l.code === item.targetLang)?.name || item.targetLang}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                          >
                            {item.starred ? (
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPhrases && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Common Phrases
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {currentPhrases.map((phrase, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    className="justify-start text-left h-auto py-2 px-3"
                    onClick={() => loadPhrase(phrase.text)}
                  >
                    <span className="truncate">{phrase.text}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 mb-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Languages className="h-4 w-4" />
                From
                {detectedLanguage && sourceLang === 'auto' && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">
                    (detected: {languages.find(l => l.code === detectedLanguage)?.name || detectedLanguage})
                  </span>
                )}
              </label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={swapLanguages}
                disabled={sourceLang === 'auto'}
                className="rounded-full"
                title="Swap languages"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Languages className="h-4 w-4" />
                To
              </label>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Source Text</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleRecording}
                    className={isListening ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : ''}
                    disabled={!recognition}
                    title="Voice input"
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speakText(sourceText, sourceLang === 'auto' ? 'en' : sourceLang)}
                    disabled={!sourceText.trim() || isSpeaking}
                    title="Listen to source"
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearSource}
                    disabled={!sourceText.trim()}
                    title="Clear"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Type or speak to translate..."
                  className="min-h-[200px] resize-none text-base"
                />
                {isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute bottom-3 left-3 flex items-center gap-2 text-red-500 text-sm"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Listening...
                  </motion.div>
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{wordCount} words</span>
                <span>{charCount} / 5000 characters</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Translation</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speakText(translatedText, targetLang)}
                    disabled={!translatedText.trim() || isSpeaking}
                    title="Listen to translation"
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(translatedText)}
                    disabled={!translatedText.trim()}
                    title="Copy translation"
                  >
                    {copyStatus === 'copied' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
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
                  className="min-h-[200px] resize-none bg-slate-50 dark:bg-slate-800/50 text-base"
                />
                {(isTranslating || isAutoDetecting || isTyping) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-md">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">
                        {isAutoDetecting ? 'Detecting language...' : 'Translating...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-4"
        >
          <span className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Ctrl+Enter</kbd> to translate
          </span>
        </motion.div>
      </div>
    </div>
  )
}
