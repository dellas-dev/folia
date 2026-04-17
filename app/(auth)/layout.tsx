export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ backgroundColor: '#f4f3f3' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at top left, rgba(55,101,107,0.08), transparent 50%), radial-gradient(circle at bottom right, rgba(80,126,132,0.06), transparent 50%)' }} />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] xl:grid xl:grid-cols-[1.1fr_0.9fr]" style={{ boxShadow: '0 8px 40px rgba(55,101,107,0.12), 0 2px 8px rgba(55,101,107,0.06)' }}>
        <div className="hidden p-10 xl:flex xl:flex-col xl:justify-between" style={{ backgroundColor: '#1d3a3f' }}>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.5)' }}>Folia</p>
            <h1 className="max-w-md text-5xl font-semibold leading-none" style={{ color: '#ffffff', fontFamily: 'var(--font-heading)' }}>The curated workspace for your creator workflow.</h1>
            <p className="max-w-md text-base leading-7" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Sign in to reach your protected dashboard, credits overview, and your generation history.
            </p>
          </div>
          <div className="grid gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Elements start as white-background JPGs, then Remove BG turns them into transparent PNGs.</div>
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>Every new account starts with a clean, intentional onboarding flow.</div>
          </div>
        </div>
        <div className="flex items-center justify-center p-5 xl:p-8" style={{ backgroundColor: '#ffffff' }}>{children}</div>
      </div>
    </div>
  )
}
