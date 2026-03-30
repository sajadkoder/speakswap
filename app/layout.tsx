import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'SpeakSwap',
  description: 'Minimal voice and text translation with live speech input and spoken playback.',
  keywords: ['translation', 'voice', 'speech recognition', 'text to speech', 'languages'],
  authors: [{ name: 'SpeakSwap Team' }],
  openGraph: {
    title: 'SpeakSwap',
    description: 'Minimal voice and text translation with live speech input and spoken playback.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
