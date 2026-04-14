# SpeakSwap

A web-based voice and text translation app built with Next.js. Translate conversations instantly, hear spoken output, and switch between languages with a clean glow-type UI and soothing animated background.

## Features

- **Voice & text translation** between 50+ languages
- **Auto-detect** the source language from typed text
- **Voice input** via the Web Speech API with locale-aware mic flow
- **Spoken playback** with intelligent voice selection per language
- **Translation history** persisted in localStorage
- **Common phrases** library for 12 languages with category browsing
- **Dark mode** with system preference detection
- **Offline indicator** that appears when network is lost
- **Keyboard shortcuts** — Escape clears input, Ctrl+Enter translates
- **Responsive layout** for desktop and mobile
- **Glow-type UI** with glassmorphism panels and animated gradient orbs

## Tech Stack

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS · Radix UI · Framer Motion
- Web Speech API (SpeechRecognition + SpeechSynthesis)
- Translation: MyMemory, LibreTranslate, Lingva (no API keys needed)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/sajadkoder/speakswap.git
cd speakswap
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
speakswap/
  app/
    api/
      translate/route.ts      # Rate-limited translation proxy
      languages/route.ts      # Supported languages list
      detect-language/route.ts # Language detection endpoint
    globals.css               # Glow theme CSS utilities
    layout.tsx                # Root layout with providers
    page.tsx                  # Main page with soothing background
  components/
    TranslationInterface.tsx  # Core translation UI
    ThemeProvider.tsx         # Dark mode context
    OfflineIndicator.tsx      # Network status banner
    ErrorBoundary.tsx         # React error boundary
    ui/                       # Radix UI primitives
  lib/
    hooks.ts                 # useLocalStorage, useDebounce, useKeyboardShortcut
    phrases.ts               # Common phrases data (12 languages)
    speech.ts                # Speech locale mapping & voice selection
    language-detection.ts    # Google + heuristic detection
    utils.ts                 # cn() utility
  types/
    index.ts                 # Shared Language, TranslationResponse, HistoryItem
  public/
    manifest.json            # PWA manifest
```

## Voice Notes

- Speech recognition requires a supported browser (Chrome, Edge, Safari) and microphone permission.
- Select the spoken language before recording — browsers cannot reliably auto-detect the spoken language.
- Playback uses the best matching system voice for the target language.

## Troubleshooting

**Microphone won't start** — Allow mic permissions, use a current browser, select the language you'll speak.

**No spoken playback** — Check device volume. Some languages fall back to a generic system voice. Voices may take a moment to load on first open.

**Translation returns nothing** — Check your network. Retry after a few seconds if an upstream service is temporarily unavailable.

## Version History

| Version | Highlights |
|---|---|
| v2.1 | Dark mode, glassmorphism, history, phrases, debounce |
| v3.0 | Bug fixes — rate limiting, input validation, aria-labels, mic/auto-detect fix, shared types, manifest.json |
| v3.1 | Glow-type UI redesign with soothing animated background |

## Contributors

- Abdulla Sajad
- Adwaith PC
- Jishnu MR
- Harikrishnan K

## License

ISC License
