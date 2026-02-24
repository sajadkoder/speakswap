"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Volume2, VolumeX, Copy, ArrowLeftRight,
  Loader2, CheckCircle, AlertCircle, Sun, Moon, History,
  Star, StarOff, Trash2, X, MessageSquare, Languages,
  Eraser, Sparkles, Globe2, Wand2, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLocalStorage, useDebounce } from '@/lib/hooks'
import { useTheme } from '@/components/ThemeProvider'
import { commonPhrases, categories, getPhrasesByLanguage } from '@/lib/phrases'

interface Language { code: string; name: string }
interface TranslationResponse { translatedText: string; source?: string; error?: string }
interface HistoryItem {
  id: string; sourceText: string; translatedText: string
  sourceLang: string; targetLang: string; timestamp: number; starred?: boolean
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
    fetch('/api/languages').then(r => r.json()).then(setLanguages).catch(() => {
      setLanguages([
        { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' }, { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' }, { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' },
      ])
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 3
      recognition.lang = sourceLang === 'auto' ? 'en-US' : sourceLang
      recognition.onstart = () => { setIsListening(true); setError(null) }
      recognition.onresult = (event) => {
        let interim = '', final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          event.results[i].isFinal ? final += t + ' ' : interim += t
        }
        if (final) { setSourceText(p => p + final); if (sourceLang === 'auto') detectLanguage(final) }
        else if (interim) { setSourceText(p => { const w = p.split(' '); w[w.length - 1] = interim; return w.join(' ') }) }
      }
      recognition.onerror = (e) => {
        setIsListening(false)
        const msgs: Record<string, string> = { 'no-speech': 'No speech detected', 'audio-capture': 'Mic not accessible', 'not-allowed': 'Mic permission denied', 'network': 'Network error' }
        setError(msgs[e.error] || `Error: ${e.error}`)
      }
      recognition.onend = () => setIsListening(false)
      setRecognition(recognition)
    }
  }, [sourceLang])

  const detectLanguage = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 10) return
    setIsAutoDetecting(true)
    try {
      const res = await fetch('/api/detect-language', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim() }) })
      const data = await res.json()
      if (data.language && data.confidence > 0.7) { setDetectedLanguage(data.language); setSourceLang(data.language) }
    } catch {} finally { setIsAutoDetecting(false) }
  }, [])

  const translateText = useCallback(async (text: string) => {
    if (!text.trim() || sourceLang === targetLang) { setTranslatedText(sourceLang === targetLang ? text : ''); return }
    if (sourceLang === 'auto' && text.length >= 10) { await detectLanguage(text); return }
    setIsTranslating(true); setError(null)
    try {
      const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim(), sourceLang: sourceLang === 'auto' ? 'en' : sourceLang, targetLang }) })
      const data: TranslationResponse = await res.json()
      if (data.error) { setError(data.error); setTranslatedText('') } else { setTranslatedText(data.translatedText) }
    } catch { setError('Translation failed'); setTranslatedText('') } finally { setIsTranslating(false) }
  }, [sourceLang, targetLang, detectLanguage])

  useEffect(() => {
    if (debouncedSource.trim()) { setIsTyping(true); translateText(debouncedSource).finally(() => setIsTyping(false)) } 
    else { setTranslatedText('') }
  }, [debouncedSource, translateText])

  useEffect(() => {
    if (sourceText.trim() && translatedText.trim() && !isTranslating) {
      const item: HistoryItem = { id: Date.now().toString(), sourceText: sourceText.trim(), translatedText: translatedText.trim(), sourceLang, targetLang, timestamp: Date.now(), starred: false }
      setHistory(prev => [item, ...prev.filter(i => i.sourceText !== sourceText.trim() || i.targetLang !== targetLang)].slice(0, MAX_HISTORY))
    }
  }, [translatedText, isTranslating, sourceLang, targetLang, sourceText, setHistory])

  const speakText = (text: string, lang: string) => {
    if (!text.trim()) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const map: Record<string, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR', ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ar: 'ar-SA', hi: 'hi-IN' }
    u.lang = map[lang] || lang
    const v = window.speechSynthesis.getVoices().find(vo => vo.lang.startsWith(lang) || vo.lang.startsWith(map[lang] || lang))
    if (v) u.voice = v
    u.rate = ['ja', 'ko', 'zh'].includes(lang) ? 0.8 : 0.9
    u.onstart = () => setIsSpeaking(true)
    u.onend = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopyStatus('copied'); setTimeout(() => setCopyStatus('idle'), 2000) } 
    catch { setError('Failed to copy') }
  }

  const toggleRecording = () => {
    if (!recognition) { setError('Speech recognition not supported'); return }
    if (isListening) recognition.stop()
    else { try { recognition.lang = sourceLang === 'auto' ? 'en-US' : sourceLang; recognition.start() } catch { setError('Failed to start') } }
  }

  const swapLanguages = () => {
    if (sourceLang === 'auto') return
    setSourceLang(targetLang); setTargetLang(sourceLang); setSourceText(translatedText); setTranslatedText(sourceText)
  }

  const toggleStar = (id: string) => setHistory(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i))
  const deleteHistoryItem = (id: string) => setHistory(prev => prev.filter(i => i.id !== id))
  const clearHistory = () => setHistory([])
  const loadFromHistory = (item: HistoryItem) => { setSourceText(item.sourceText); setTranslatedText(item.translatedText); setSourceLang(item.sourceLang); setTargetLang(item.targetLang); setShowHistory(false) }
  const loadPhrase = (phrase: string) => { setSourceText(phrase); setShowPhrases(false) }
  const clearSource = () => { setSourceText(''); setTranslatedText(''); setError(null) }

  const currentPhrases = useMemo(() => {
    const p = getPhrasesByLanguage(sourceLang === 'auto' ? 'en' : sourceLang)
    return selectedCategory === 'all' ? p.phrases : p.phrases.filter(q => q.category === selectedCategory)
  }, [sourceLang, selectedCategory])

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0
  const favoriteItems = history.filter(i => i.starred)

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg glow-violet">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">SpeakSwap</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> AI-powered translation • 70+ languages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="relative">
              <History className="w-5 h-5" />
              {history.length > 0 && <span className="absolute -top-1 -right-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{history.length > 9 ? '9+' : history.length}</span>}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowPhrases(!showPhrases)}><MessageSquare className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass rounded-2xl overflow-hidden border border-white/20 dark:border-white/10">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-violet-500" /> History {favoriteItems.length > 0 && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 rounded-full">{favoriteItems.length} ★</span>}</h3>
                {history.length > 0 && <Button variant="ghost" size="sm" onClick={clearHistory}><Trash2 className="w-4 h-4" /></Button>}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {history.length === 0 ? <p className="p-4 text-center text-slate-500 text-sm">No history yet</p> : (
                  <div className="divide-y divide-slate-200/30 dark:divide-slate-700/30">
                    {history.slice(0, 15).map(item => (
                      <div key={item.id} onClick={() => loadFromHistory(item)} className="p-3 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-pink-50/50 dark:hover:from-violet-900/20 dark:hover:to-pink-900/20 cursor-pointer group flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.sourceText}</p>
                          <p className="text-xs text-slate-500 truncate">{item.translatedText}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleStar(item.id) }}>{item.starred ? <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> : <StarOff className="w-3 h-3" />}</Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id) }}><X className="w-3 h-3" /></Button>
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
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass rounded-2xl overflow-hidden border border-white/20 dark:border-white/10">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <h3 className="font-bold flex items-center gap-2 mb-3"><Wand2 className="w-4 h-4 text-pink-500" /> Quick Phrases</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')} className={selectedCategory === 'all' ? 'bg-gradient-to-r from-violet-500 to-pink-500 border-0' : ''}>All</Button>
                  {categories.map(cat => <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'bg-gradient-to-r from-violet-500 to-pink-500 border-0' : ''}>{cat}</Button>)}
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                {currentPhrases.map((phrase, idx) => (
                  <Button key={idx} variant="ghost" className="justify-start text-left h-auto py-2 px-3 hover:bg-gradient-to-r hover:from-violet-100 hover:to-pink-100 dark:hover:from-violet-900/30 dark:hover:to-pink-900/30" onClick={() => loadPhrase(phrase.text)}>
                    <span className="truncate">{phrase.text}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-500" /></div>
            <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError(null)}><X className="w-4 h-4" /></Button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-3xl shadow-2xl border-0 overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
            <div className="p-5 md:p-7">
              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-5 mb-7 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" /> From
                    {detectedLanguage && sourceLang === 'auto' && <span className="text-xs text-violet-600 dark:text-violet-400">(detected: {languages.find(l => l.code === detectedLanguage)?.name})</span>}
                  </label>
                  <Select value={sourceLang} onValueChange={setSourceLang}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={swapLanguages} disabled={sourceLang === 'auto'} className="rounded-full w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all hover:scale-110">
                  <ArrowLeftRight className="w-5 h-5" />
                </Button>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500" /> To
                  </label>
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs">A</span> Source</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={toggleRecording} className={`rounded-xl ${isListening ? 'bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse' : ''}`} disabled={!recognition}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</Button>
                      <Button variant="ghost" size="icon" onClick={() => speakText(sourceText, sourceLang === 'auto' ? 'en' : sourceLang)} disabled={!sourceText.trim() || isSpeaking} className="rounded-xl">{isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</Button>
                      <Button variant="ghost" size="icon" onClick={clearSource} disabled={!sourceText.trim()} className="rounded-xl"><Eraser className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Type or speak to translate..." className="min-h-[180px] resize-none rounded-2xl border-2 border-transparent bg-white/60 dark:bg-slate-800/60 focus:border-violet-400 focus:ring-0 text-base" />
                    {isListening && <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute bottom-4 left-4 flex items-center gap-2 text-red-500 text-sm font-medium"><div className="w-2 h-2 rounded-full bg-red-500" /> Listening...</motion.div>}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-medium"><span>{wordCount} words</span><span>{sourceText.length} / 5000</span></div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><span className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xs">文</span> Translation</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => speakText(translatedText, targetLang)} disabled={!translatedText.trim() || isSpeaking} className="rounded-xl">{isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</Button>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(translatedText)} disabled={!translatedText.trim()} className="rounded-xl">{copyStatus === 'copied' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea value={translatedText} readOnly placeholder="Translation appears here..." className="min-h-[180px] resize-none rounded-2xl bg-gradient-to-br from-violet-50/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-800/50 text-base" />
                    {(isTranslating || isAutoDetecting || isTyping) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Loader2 className="w-5 h-5 text-violet-500" /></motion.div>
                          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{isAutoDetecting ? 'Detecting...' : 'Translating...'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Powered by AI • Press <kbd className="px-1.5 py-0.5 mx-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-md">Ctrl+Enter</kbd> to translate
          </div>
        </motion.div>
      </div>
    </div>
  )
}
