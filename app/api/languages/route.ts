import { NextResponse } from 'next/server';

// Fallback language list in case API is down
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
  { code: 'zh', name: 'Chinese' },
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
];

export async function GET() {
  try {
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
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const languages = await response.json();
            if (Array.isArray(languages) && languages.length > 0) {
              return NextResponse.json(languages);
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
    return NextResponse.json(fallbackLanguages);
    
  } catch (error) {
    console.error('Languages fetch error:', error);
    // Return fallback languages on any error
    return NextResponse.json(fallbackLanguages);
  }
}
