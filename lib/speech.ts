const SPEECH_LOCALE_MAP: Record<string, string> = {
  am: 'am-ET',
  ar: 'ar-SA',
  az: 'az-AZ',
  be: 'be-BY',
  bg: 'bg-BG',
  bn: 'bn-BD',
  bs: 'bs-BA',
  ca: 'ca-ES',
  cs: 'cs-CZ',
  cy: 'cy-GB',
  da: 'da-DK',
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  et: 'et-EE',
  eu: 'eu-ES',
  fa: 'fa-IR',
  fi: 'fi-FI',
  fr: 'fr-FR',
  ga: 'ga-IE',
  gl: 'gl-ES',
  gu: 'gu-IN',
  he: 'he-IL',
  hi: 'hi-IN',
  hr: 'hr-HR',
  hu: 'hu-HU',
  id: 'id-ID',
  is: 'is-IS',
  it: 'it-IT',
  ja: 'ja-JP',
  ka: 'ka-GE',
  kk: 'kk-KZ',
  km: 'km-KH',
  kn: 'kn-IN',
  ko: 'ko-KR',
  ky: 'ky-KG',
  lo: 'lo-LA',
  lt: 'lt-LT',
  lv: 'lv-LV',
  mk: 'mk-MK',
  ml: 'ml-IN',
  mn: 'mn-MN',
  mr: 'mr-IN',
  ms: 'ms-MY',
  mt: 'mt-MT',
  my: 'my-MM',
  ne: 'ne-NP',
  nl: 'nl-NL',
  no: 'nb-NO',
  pa: 'pa-IN',
  pl: 'pl-PL',
  pt: 'pt-BR',
  ro: 'ro-RO',
  ru: 'ru-RU',
  si: 'si-LK',
  sk: 'sk-SK',
  sl: 'sl-SI',
  sq: 'sq-AL',
  sr: 'sr-RS',
  sv: 'sv-SE',
  sw: 'sw-KE',
  ta: 'ta-IN',
  te: 'te-IN',
  th: 'th-TH',
  tl: 'fil-PH',
  tr: 'tr-TR',
  uk: 'uk-UA',
  ur: 'ur-PK',
  uz: 'uz-UZ',
  vi: 'vi-VN',
  zh: 'zh-CN',
}

function getPrimaryLanguageCode(languageTag: string): string {
  return languageTag.toLowerCase().split('-')[0]
}

export function getSpeechLocale(languageCode: string): string {
  return SPEECH_LOCALE_MAP[languageCode] || languageCode
}

export function findBestVoice(languageCode: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferredLocale = getSpeechLocale(languageCode).toLowerCase()
  const primaryCode = getPrimaryLanguageCode(languageCode)

  return (
    voices.find((voice) => voice.lang.toLowerCase() === preferredLocale) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${primaryCode}-`)) ||
    voices.find((voice) => getPrimaryLanguageCode(voice.lang) === primaryCode) ||
    null
  )
}
