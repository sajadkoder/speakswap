import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for translations
const translationCache = new Map<string, { translation: string; timestamp: number; source: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Language code mappings for different APIs
const LANGUAGE_MAPPINGS: { [key: string]: { [api: string]: string } } = {
  'zh': { mymemory: 'zh-CN', libre: 'zh', google: 'zh-cn' },
  'pt': { mymemory: 'pt-BR', libre: 'pt', google: 'pt' },
  'ar': { mymemory: 'ar', libre: 'ar', google: 'ar' },
};

function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${sourceLang}-${targetLang}-${text.toLowerCase().trim()}`;
}

function getFromCache(key: string) {
  const cached = translationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  translationCache.delete(key);
  return null;
}

function setCache(key: string, translation: string, source: string) {
  translationCache.set(key, {
    translation,
    timestamp: Date.now(),
    source
  });
}

function mapLanguageCode(langCode: string, api: 'mymemory' | 'libre' | 'google'): string {
  return LANGUAGE_MAPPINGS[langCode]?.[api] || langCode;
}

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate text length
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      );
    }

    // If source and target are the same, return the original text
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text });
    }

    // Check cache first
    const cacheKey = getCacheKey(text, sourceLang, targetLang);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json({
        translatedText: cached.translation,
        source: cached.source + ' (cached)'
      });
    }

    // Try MyMemory API first (more reliable and free)
    try {
      const mappedSourceLang = mapLanguageCode(sourceLang, 'mymemory');
      const mappedTargetLang = mapLanguageCode(targetLang, 'mymemory');
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${mappedSourceLang}|${mappedTargetLang}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(myMemoryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpeakSwap/1.0'
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText && 
            data.responseData.translatedText.toLowerCase() !== text.toLowerCase()) {
          const translation = data.responseData.translatedText;
          setCache(cacheKey, translation, 'MyMemory');
          return NextResponse.json({ 
            translatedText: translation,
            source: 'MyMemory',
            confidence: data.responseData.match || 0
          });
        }
      }
    } catch (error) {
      console.log('MyMemory API failed:', error);
    }

    // Try LibreTranslate endpoints as backup
    const libreEndpoints = [
      'https://libretranslate.de/translate',
      'https://libretranslate.com/translate',
      'https://translate.argosopentech.com/translate'
    ];

    for (const endpoint of libreEndpoints) {
      try {
        const mappedSourceLang = mapLanguageCode(sourceLang, 'libre');
        const mappedTargetLang = mapLanguageCode(targetLang, 'libre');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SpeakSwap/1.0'
          },
          signal: controller.signal,
          body: JSON.stringify({
            q: text,
            source: mappedSourceLang,
            target: mappedTargetLang,
            format: 'text',
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.translatedText && data.translatedText.toLowerCase() !== text.toLowerCase()) {
              const translation = data.translatedText;
              setCache(cacheKey, translation, 'LibreTranslate');
              return NextResponse.json({ 
                translatedText: translation,
                source: 'LibreTranslate'
              });
            }
          }
        }
      } catch (error) {
        console.log(`LibreTranslate failed for ${endpoint}:`, error);
        continue;
      }
    }

    // Try Google Translate as last resort (using public API)
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${mapLanguageCode(sourceLang, 'google')}&tl=${mapLanguageCode(targetLang, 'google')}&dt=t&q=${encodeURIComponent(text)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(googleUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translation = data[0].map((item: any) => item[0]).join('');
          if (translation.toLowerCase() !== text.toLowerCase()) {
            setCache(cacheKey, translation, 'Google Translate');
            return NextResponse.json({ 
              translatedText: translation,
              source: 'Google Translate'
            });
          }
        }
      }
    } catch (error) {
      console.log('Google Translate failed:', error);
    }

    // If all real APIs fail, provide a helpful message
    console.log('All translation APIs failed for:', { text: text.substring(0, 50), sourceLang, targetLang });
    
    return NextResponse.json({ 
      translatedText: `[Translation unavailable: ${sourceLang} → ${targetLang}] ${text}`,
      error: 'All translation services are temporarily unavailable. Please try again later.',
      source: 'Error'
    }, { status: 503 });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
