# SpeakSwap - Real-time Voice Translation App

**🚀 Migrated from Android app to web app for better cross-platform accessibility**

A modern, responsive web application built with Next.js that provides real-time language translation with voice input/output capabilities using multiple translation APIs. Originally developed as an Android application, SpeakSwap has been migrated to the web to provide universal access across all devices and platforms.

## Features

- 🌐 **Real-time Translation**: Instant text translation between multiple languages
- 🎤 **Voice Input**: Speech-to-text functionality with microphone support
- 🔊 **Voice Output**: Text-to-speech for hearing translations in target language
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and shadcn/ui components
- ✨ **Smooth Animations**: Powered by Framer Motion for delightful user interactions
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🔄 **Language Swap**: Quick swap between source and target languages
- ⚡ **Fast Performance**: Optimized with Next.js 15+ App Router
- 🛡️ **Error Handling**: Robust error handling with user-friendly feedback
- 🔧 **TypeScript**: Full type safety throughout the application
- 🌍 **Multiple APIs**: Uses MyMemory, LibreTranslate, and Lingva for reliable translation
- 🔄 **Cross-Platform**: Migrated from Android to web for universal accessibility

## ✨ Recent Updates (v2.0)

**Major Bug Fixes & Enhancements:**
- 🎤 **Enhanced Speech Detection**: Improved accuracy with interim results, better error handling, and microphone permission checks
- 🌐 **Better Translation Accuracy**: Added caching, Google Translate fallback, and enhanced API error handling
- 🔍 **Auto Language Detection**: Intelligent language detection with pattern-based fallbacks
- 🔊 **Improved Voice Synthesis**: Language-specific voice selection and optimized speech parameters
- ⚡ **Backend Optimization**: In-memory caching, comprehensive language support (70+ languages), and performance improvements
- 🛠️ **Enhanced Error Handling**: User-friendly error messages and robust fallback mechanisms

## Contributors

This mini project was developed as part of our college coursework by:

- **Abdulla Sajad** - [@abdullasajad](https://github.com/abdullasajad)
- **Adwaith PC**
- **Jishnu MR**
- **Harikrishnan K**

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Translation APIs**: MyMemory, LibreTranslate, Lingva Translate
- **Voice Features**: Web Speech API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abdullasajad/speakswap.git
cd speakswap
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select Languages**: Choose source and target languages from the dropdowns
2. **Input Text**: 
   - Type directly in the text area, OR
   - Click 🎤 microphone button to speak (requires microphone permission)
3. **Get Translation**: See real-time translation appear automatically
4. **Listen**: Click 🔊 speaker button to hear the translation pronounced
5. **Copy**: Click 📋 to copy text to clipboard
6. **Swap**: Click ↔️ to instantly swap source and target languages

## Voice Features

### Speech Recognition (Voice Input)
- Supports 60+ languages
- Requires microphone permissions
- Works on HTTPS or localhost
- Real-time speech-to-text conversion

### Text-to-Speech (Voice Output)
- Natural voice synthesis
- Language-specific pronunciation
- Adjustable speech rate and pitch
- Cross-browser compatibility

## Browser Support

- **Best Experience**: Chrome, Edge (full voice features)
- **Good Support**: Safari (voice features work)
- **Limited Support**: Firefox (translation works, limited voice features)

## API Integration

The app uses multiple translation services for reliability:

1. **MyMemory API** (Primary) - Free, reliable translation service
2. **LibreTranslate** (Backup) - Open-source translation
3. **Lingva Translate** (Tertiary) - Google Translate alternative

No API keys required - all services are free to use.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
speakswap/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── languages/     # Language list endpoint
│   │   └── translate/     # Translation endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy with zero configuration

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS
- DigitalOcean

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Troubleshooting

### Voice Features Not Working

**Speech Recognition Issues:**
- **Network Error**: Check your internet connection and try again
- **Not Allowed**: Allow microphone permissions in your browser
- **No Speech**: Speak clearly and try again
- **Audio Capture**: Check if your microphone is connected and working
- **Service Not Allowed**: Try refreshing the page or use a different browser

**Text-to-Speech Issues:**
- Ensure your browser supports Web Speech API (Chrome, Edge, Safari)
- Check if your system volume is turned up
- Try a different language if the current one doesn't work

### Translation Not Working

**If you see "Translation services are currently unavailable":**
1. Check your internet connection
2. Try refreshing the page
3. The app tries multiple translation services automatically
4. Some services may be temporarily down

### Browser Compatibility

**Recommended Browsers:**
- Chrome 25+ (best support)
- Edge 79+
- Safari 14.1+
- Firefox 62+ (limited voice support)

**Requirements for Voice Features:**
- HTTPS connection (or localhost for development)
- Microphone permissions granted
- Modern browser with Web Speech API support

### Common Issues

1. **App not loading**: Clear browser cache and refresh
2. **Styles not applying**: Ensure Tailwind CSS is properly loaded
3. **Voice buttons not appearing**: Check browser compatibility and permissions
4. **Translation delays**: Normal for first translation, subsequent ones are faster

## Migration from Android to Web

SpeakSwap was originally developed as an Android application but has been successfully migrated to a web application to provide:

- **Universal Access**: Works on any device with a web browser
- **No Installation Required**: Instant access without app store downloads
- **Cross-Platform Compatibility**: Supports Windows, macOS, Linux, iOS, and Android
- **Real-time Updates**: Instant feature updates without app store approval
- **Better Accessibility**: Enhanced accessibility features for all users
- **Improved Performance**: Leverages modern web technologies for optimal performance

The migration maintains all core functionality while adding new web-specific features like clipboard integration and enhanced keyboard shortcuts.

## About This Project

SpeakSwap is a **college mini project** that demonstrates modern web development practices and real-world application of voice translation technology. This project showcases the collaborative effort of our team in creating a practical solution for language barriers.

**Academic Context**: Developed as part of our computer science curriculum to explore web technologies, API integration, and user interface design.

## Acknowledgments

- [MyMemory API](https://mymemory.translated.net/) for reliable translation service
- [LibreTranslate](https://libretranslate.de/) for providing free translation API
- [Lingva Translate](https://lingva.ml/) for additional translation support
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for voice features
- Our college faculty for guidance and support throughout the development process
