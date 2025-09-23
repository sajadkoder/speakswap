export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            SpeakSwap
          </h1>
          <p className="text-gray-600 mb-4">Translate text between multiple languages in real-time</p>
          <p className="text-sm text-gray-500">Voice translation app with speech-to-text and text-to-speech features</p>
        </header>

        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              Full voice translation features are being deployed. This includes:
            </p>
            <ul className="text-left space-y-2 mb-6">
              <li>🎤 Voice input with speech recognition</li>
              <li>🔊 Voice output with text-to-speech</li>
              <li>🌐 Real-time translation between 60+ languages</li>
              <li>📱 Responsive design for all devices</li>
              <li>✨ Beautiful animations and smooth UX</li>
            </ul>
            <p className="text-sm text-gray-500">
              Repository: <a href="https://github.com/abdullasajad/speakswap" className="text-blue-600 hover:underline">github.com/abdullasajad/speakswap</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
