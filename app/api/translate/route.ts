import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // If source and target are the same, return the original text
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text });
    }

    // Try MyMemory API first (more reliable and free)
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      
      const response = await fetch(myMemoryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
          return NextResponse.json({ 
            translatedText: data.responseData.translatedText,
            source: 'MyMemory'
          });
        }
      }
    } catch (error) {
      console.log('MyMemory API failed:', error);
    }

    // Try LibreTranslate endpoints as backup
    const libreEndpoints = [
      'https://libretranslate.de/translate',
      'https://libretranslate.com/translate'
    ];

    for (const endpoint of libreEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.translatedText) {
              return NextResponse.json({ 
                translatedText: data.translatedText,
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

    // If all real APIs fail, provide a helpful message
    console.log('All translation APIs failed');
    
    return NextResponse.json({ 
      translatedText: `Translation services are currently unavailable. Please try again later.`,
      error: 'All translation services are temporarily unavailable',
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
