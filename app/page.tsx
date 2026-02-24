import TranslationInterface from '@/components/TranslationInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-mesh bg-fixed">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-violet-300 dark:bg-violet-600/20 rounded-full blur-3xl opacity-30 animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 dark:bg-pink-600/20 rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-amber-200 dark:bg-amber-600/15 rounded-full blur-3xl opacity-25 animate-float-slow" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative z-10">
        <TranslationInterface />
      </div>
    </main>
  )
}
