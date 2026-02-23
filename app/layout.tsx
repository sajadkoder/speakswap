import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpeakSwap - Voice Translation App',
  description: 'Real-time language translation with voice input/output capabilities. Translate between 70+ languages instantly.',
  keywords: ['translation', 'voice', 'languages', 'multilingual', 'speech recognition', 'text to speech'],
  authors: [{ name: 'SpeakSwap Team' }],
  openGraph: {
    title: 'SpeakSwap - Voice Translation App',
    description: 'Real-time language translation with voice input/output capabilities',
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
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
