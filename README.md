# SpeakSwap

SpeakSwap is a web-based translation app that lets you translate text and speech between languages directly in the browser. You can type or speak into the app, get a translation, and hear the result spoken back. No API keys are needed ? it uses free translation endpoints. The app runs fully in the browser with a server-side proxy to handle translation requests.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion
- Web Speech API (SpeechRecognition + SpeechSynthesis)
- Translation: MyMemory, LibreTranslate, Lingva

## Features

- Translate text between multiple languages
- Voice input with Web Speech API (Chrome, Edge, Safari)
- Spoken playback of translations
- Auto-detect source language from typed text
- Translation history saved in localStorage
- Common phrases library for 12 languages
- Dark mode with system preference detection
- Keyboard shortcuts: Escape clears input, Ctrl+Enter translates
- Offline indicator when network is lost
- Responsive layout for desktop and mobile

## Prerequisites

- Node.js 18 or newer
- npm

## Installation

```bash
git clone https://github.com/neuralbroker/speakswap.git
cd speakswap
npm install
```

## Usage

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Voice Input

1. Select the language you plan to speak in the source language dropdown.
2. Click the microphone button to start recording.
3. Speak clearly into your microphone.
4. Your speech is converted to text and placed in the source field.
5. Press Ctrl+Enter or click the translate button to get the translation.
6. Click the speaker button next to the translation to hear it spoken.

Note: Auto-detect works for typed text only. For voice input, you must select the language before recording. The Web Speech API cannot reliably auto-detect spoken language.

### API Endpoints

The app exposes the following server-side API routes:

| Endpoint | Method | Description |
|---|---|---|
| `/api/translate` | POST | Translate text. Body: `{ text, sourceLang, targetLang }` |
| `/api/languages` | GET | Get list of supported languages |
| `/api/detect-language` | POST | Detect language of input text. Body: `{ text }` |

All endpoints are rate-limited. The `/api/translate` endpoint falls back through multiple translation services if one fails.

## Project Structure

```
speakswap/
  app/
    api/
      translate/          # Translation proxy with rate limiting and caching
      languages/          # Supported languages list endpoint
      detect-language/    # Language detection endpoint
    globals.css           # Global styles and theme
    layout.tsx            # Root layout with providers
    page.tsx              # Main page
  components/
    TranslationInterface.tsx  # Main translation UI component
    ThemeProvider.tsx         # Dark mode context
    OfflineIndicator.tsx      # Network status display
    ErrorBoundary.tsx         # React error boundary
    ui/                   # Radix UI primitive components
  lib/
    hooks.ts              # useLocalStorage, useDebounce, useKeyboardShortcut
    phrases.ts            # Common phrases data for 12 languages
    speech.ts             # Speech locale mapping and voice selection
    language-detection.ts # Language detection logic
    utils.ts              # Utility functions
  types/
    index.ts              # Shared TypeScript interfaces
  public/
    manifest.json         # PWA manifest
```

## Environment Variables

SpeakSwap does not require any environment variables to run. All translation services are accessed through free public endpoints.

If you want to use paid translation services in the future, add API keys to a `.env.local` file. The app reads `NEXT_PUBLIC_` prefixed variables.

## Contributing

Contributions are welcome. Open an issue to discuss changes before submitting a pull request.

## License

ISC License
