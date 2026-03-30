# SpeakSwap

SpeakSwap is a web-based voice and text translation app built with Next.js. It helps people translate short conversations quickly, listen to spoken output, and move between languages with a calm, minimal interface.

## Overview

- Real-time translation between dozens of languages
- Voice input for supported browsers using the Web Speech API
- Spoken playback with language-aware voice selection
- Auto-detect for typed text translation
- Translation history and quick phrase support
- Responsive layout for desktop and mobile

## Recent Improvements

- Reworked the interface with a cleaner, more minimal visual style
- Fixed auto-detect handling across the client and API routes
- Improved microphone flow so spoken input uses an explicit speech locale
- Added better voice matching for spoken playback
- Prevented stale translation requests from overwriting newer results
- Cleaned up local storage updates and phrase data issues

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion
- Web Speech API

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
git clone https://github.com/sajadkoder/speakswap.git
cd speakswap
npm install
```

### Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

## Available Scripts

- `npm run dev` starts the development server
- `npm run build` creates the production build
- `npm run start` starts the production server
- `npm run lint` runs ESLint across the project

## Voice Notes

- Speech recognition depends on browser support and microphone permissions.
- For voice input, the spoken language must be selected before recording.
- Auto-detect is used for translation requests, but browsers do not reliably auto-detect the spoken language for microphone input.
- Spoken output uses the best matching system voice available for the selected target language.

## Translation Services

The app uses multiple translation backends for reliability, including MyMemory, LibreTranslate, and Lingva-based fallbacks. No API key is required for the current setup.

## Project Structure

```text
speakswap/
  app/
    api/
    globals.css
    layout.tsx
    page.tsx
  components/
    ui/
  lib/
  public/
  types/
```

## Troubleshooting

### Microphone does not start

- Confirm microphone permissions are allowed in the browser.
- Use a current version of Chrome, Edge, or Safari.
- Make sure you selected the language you plan to speak.

### Spoken playback is unavailable

- Check that your device volume is on.
- Some languages may fall back to a more generic system voice.
- Wait a moment for browser voices to finish loading on first page open.

### Translation does not return a result

- Check your network connection.
- Retry after a few seconds if an upstream translation service is temporarily unavailable.

## Contributors

- Abdulla Sajad
- Adwaith PC
- Jishnu MR
- Harikrishnan K

## License

This project is licensed under the ISC License.
