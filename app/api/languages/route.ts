import { NextResponse } from 'next/server';

// Enhanced language list with more languages and better organization
const fallbackLanguages = [
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
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'be', name: 'Belarusian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'sq', name: 'Albanian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'me', name: 'Montenegrin' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ga', name: 'Irish' },
  { code: 'mt', name: 'Maltese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'eu', name: 'Basque' },
  { code: 'ca', name: 'Catalan' },
  { code: 'gl', name: 'Galician' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Filipino' },
  { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharic' },
  { code: 'he', name: 'Hebrew' },
  { code: 'fa', name: 'Persian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ne', name: 'Nepali' },
  { code: 'si', name: 'Sinhala' },
  { code: 'my', name: 'Myanmar' },
  { code: 'km', name: 'Khmer' },
  { code: 'lo', name: 'Lao' },
  { code: 'ka', name: 'Georgian' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'tg', name: 'Tajik' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'az', name: 'Azerbaijani' },
];

// In-memory cache for languages
let languagesCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  try {
    // Check cache first
    if (languagesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(languagesCache);
    }

    // Try multiple LibreTranslate instances
    const endpoints = [
      'https://libretranslate.de/languages',
      'https://libretranslate.com/languages',
      'https://translate.argosopentech.com/languages'
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'SpeakSwap/1.0'
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const languages = await response.json();
            if (Array.isArray(languages) && languages.length > 0) {
              // Merge with fallback languages for comprehensive list
              const mergedLanguages = [...languages];
              
              // Add any missing languages from fallback
              fallbackLanguages.forEach(fallbackLang => {
                if (!languages.find(lang => lang.code === fallbackLang.code)) {
                  mergedLanguages.push(fallbackLang);
                }
              });
              
              // Sort alphabetically by name
              mergedLanguages.sort((a, b) => a.name.localeCompare(b.name));
              
              // Cache the result
              languagesCache = mergedLanguages;
              cacheTimestamp = Date.now();
              
              return NextResponse.json(mergedLanguages);
            }
          }
        }
      } catch (err) {
        console.log(`Failed to fetch from ${endpoint}:`, err);
        continue;
      }
    }

    // If all APIs fail, return fallback languages
    console.log('All LibreTranslate APIs failed, using fallback languages');
    
    // Sort fallback languages alphabetically
    const sortedFallback = [...fallbackLanguages].sort((a, b) => a.name.localeCompare(b.name));
    
    // Cache fallback languages
    languagesCache = sortedFallback;
    cacheTimestamp = Date.now();
    
    return NextResponse.json(sortedFallback);
    
  } catch (error) {
    console.error('Languages fetch error:', error);
    // Return fallback languages on any error
    const sortedFallback = [...fallbackLanguages].sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(sortedFallback);
  }
}
