import TranslationInterface from '@/components/TranslationInterface'

export default function Home() {
  return (
    <main className="page-shell">
      <div className="soothing-bg">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full opacity-[0.07] dark:opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, hsl(250, 80%, 68%) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full opacity-[0.06] dark:opacity-[0.1]"
          style={{ background: 'radial-gradient(circle, hsl(280, 70%, 65%) 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full opacity-[0.04] dark:opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, hsl(200, 80%, 65%) 0%, transparent 70%)' }} />
      </div>
      <TranslationInterface />
    </main>
  )
}
