import { NextRequest, NextResponse } from 'next/server';

// Simple language detection using character patterns and common words
const LANGUAGE_PATTERNS = {
  'en': {
    patterns: [/\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are|you)\b/gi],
    chars: /^[a-zA-Z\s.,!?'"()-]+$/,
    commonWords: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with']
  },
  'es': {
    patterns: [/\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|al|una|del|todo|pero|más|hay|muy|fue|era|está|han|puede|o|ser|tiene|hace|cada|día|tiempo|año|dos|vida|sobre|entre|estado|ciudad|casi|siempre|tanto|hasta|agua|menos|debe|casa|bajo|algo|sin|mismo|yo|también|sólo|después|primer|gobierno|tanto|durante|siempre|gran|país|según|menos|mundo|año|antes|estado|momento|desde|muy|sin|otro|mucho|donde|bien|parte|nueva|tener|gran|mismo|trabajo|poco|gobierno|tan|nuevo|tener)\b/gi],
    chars: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s.,!?'"()-]+$/,
    commonWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no']
  },
  'fr': {
    patterns: [/\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|par|grand|en|être|et|à|il|avoir|ne|pas|que|vous|tout|plus|sur|mon|avec|être|ce|son|une|si|mais|ou|et|donc|ni|car)\b/gi],
    chars: /^[a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s.,!?'"()-]+$/,
    commonWords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'en', 'avoir', 'que']
  },
  'de': {
    patterns: [/\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|sind|noch|wie|einem|über|einen|so|zum|war|haben|nur|oder|aber|vor|zur|bis|unter|auch|durch|man|viel|Jahre|Jahr|kommen|können|Zeit|sehr|sein|Jahr|neue|können|zwischen|Leben|mehr|dazu|kein|werden|diese|damit|schon|wenn|hier|alle|als|was|gegen|vom)\b/gi],
    chars: /^[a-zA-ZäöüßÄÖÜ\s.,!?'"()-]+$/,
    commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
  },
  'it': {
    patterns: [/\b(il|di|che|e|la|per|in|un|è|da|sono|con|non|una|su|le|si|come|lo|a|mi|o|ci|ma|anche|tutto|ancora|questa|quella|ogni|molto|dove|cosa|come|quando|perché|più|bene|fare|dire|grande|stesso|altro|ultimo|lungo|fare|stare|dare|sapere|dovere|volere|dire|fare|andare|potere|dovere|stare|bene|grande|nuovo|primo|ultimo|italiano|tempo|persona|anno|mano|giorno|vita|volta)\b/gi],
    chars: /^[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s.,!?'"()-]+$/,
    commonWords: ['il', 'di', 'che', 'e', 'la', 'per', 'in', 'un', 'è', 'da']
  },
  'pt': {
    patterns: [/\b(o|de|a|e|que|do|da|em|um|para|é|com|não|uma|os|no|se|na|por|mais|as|dos|como|mas|foi|ao|ele|das|tem|à|seu|sua|ou|ser|quando|muito|há|nos|já|está|eu|também|só|pelo|pela|até|isso|ela|entre|era|depois|sem|mesmo|aos|ter|seus|quem|nas|me|esse|eles|estão|você|tinha|foram|essa|num|nem|suas|meu|às|minha|têm|numa|pelos|elas|havia|seja|qual|será|nós|tenho|lhe|deles|essas|esses|pelas|este|fosse|dele)\b/gi],
    chars: /^[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\s.,!?'"()-]+$/,
    commonWords: ['o', 'de', 'a', 'e', 'que', 'do', 'da', 'em', 'um', 'para']
  },
  'ru': {
    patterns: [/\b(в|и|не|на|я|быть|с|он|а|как|по|но|они|к|у|ты|из|за|свой|что|этот|же|тот|мы|уже|где|здесь|когда|даже|она|под|будет|жить|говорить|работать|любить|иметь|стать|знать|год|человек|время|рука|дело|раз|два|очень|после|слово|такой|наш|большой|новый|первый|хороший|важный|каждый|русский|главный|белый|последний|целый|собственный|общий|молодой|социальный|политический)\b/gi],
    chars: /^[а-яёА-ЯЁ\s.,!?'"()-]+$/,
    commonWords: ['в', 'и', 'не', 'на', 'я', 'быть', 'с', 'он', 'а', 'как']
  },
  'ja': {
    patterns: [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g],
    chars: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s.,!?'"()-]+$/,
    commonWords: []
  },
  'ko': {
    patterns: [/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g],
    chars: /^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s.,!?'"()-]+$/,
    commonWords: []
  },
  'zh': {
    patterns: [/[\u4E00-\u9FFF]/g],
    chars: /^[\u4E00-\u9FFF\s.,!?'"()-]+$/,
    commonWords: []
  },
  'ar': {
    patterns: [/[\u0600-\u06FF]/g],
    chars: /^[\u0600-\u06FF\s.,!?'"()-]+$/,
    commonWords: []
  }
};

function detectLanguageSimple(text: string): { language: string; confidence: number } {
  const cleanText = text.toLowerCase().trim();
  const scores: { [key: string]: number } = {};

  // Initialize scores
  Object.keys(LANGUAGE_PATTERNS).forEach(lang => {
    scores[lang] = 0;
  });

  // Check character patterns
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    // For CJK languages, check character presence
    if (['ja', 'ko', 'zh', 'ar'].includes(lang)) {
      const matches = text.match(config.patterns[0]);
      if (matches) {
        scores[lang] += matches.length / text.length * 100;
      }
    } else {
      // For Latin-based languages, check common words
      const words = cleanText.split(/\s+/);
      let matchCount = 0;
      
      config.commonWords.forEach(commonWord => {
        if (words.includes(commonWord)) {
          matchCount++;
        }
      });
      
      scores[lang] = (matchCount / Math.min(words.length, 20)) * 100;
    }
  }

  // Find the language with the highest score
  const sortedScores = Object.entries(scores)
    .sort(([,a], [,b]) => b - a);
  
  const [topLanguage, topScore] = sortedScores[0];
  
  return {
    language: topLanguage,
    confidence: Math.min(topScore / 100, 1)
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length < 3) {
      return NextResponse.json(
        { error: 'Text too short for language detection' },
        { status: 400 }
      );
    }

    // Try Google Translate's language detection API first
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
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
        if (data && data[2]) {
          return NextResponse.json({
            language: data[2],
            confidence: 0.9,
            source: 'Google Translate'
          });
        }
      }
    } catch (error) {
      console.log('Google language detection failed:', error);
    }

    // Fallback to simple pattern-based detection
    const result = detectLanguageSimple(text);
    
    if (result.confidence < 0.3) {
      return NextResponse.json({
        language: 'en', // Default to English
        confidence: 0.5,
        source: 'Default (insufficient confidence)'
      });
    }

    return NextResponse.json({
      language: result.language,
      confidence: result.confidence,
      source: 'Pattern-based detection'
    });

  } catch (error) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      { error: 'Language detection failed' },
      { status: 500 }
    );
  }
}
