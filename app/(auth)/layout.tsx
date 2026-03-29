export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.95_0.05_85),transparent_35%),linear-gradient(180deg,oklch(0.99_0.006_84),oklch(0.965_0.015_84))]" />
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-5xl rounded-[2rem] border border-border/60 bg-background/85 p-5 shadow-xl shadow-black/5 backdrop-blur xl:grid xl:grid-cols-[1.1fr_0.9fr] xl:gap-6 xl:p-6">
        <div className="hidden rounded-[1.6rem] bg-[linear-gradient(145deg,oklch(0.97_0.04_85),oklch(0.93_0.06_145))] p-10 text-foreground xl:flex xl:flex-col xl:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-foreground/70">Folia</p>
            <h1 className="max-w-md text-5xl font-semibold leading-none">The clean SaaS shell for your future clipart workflow.</h1>
            <p className="max-w-md text-base leading-7 text-foreground/75">
              Sign in to reach your protected dashboard, credits overview, and the app structure that later phases build on.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-foreground/75">
            <div className="rounded-2xl border border-white/40 bg-white/40 px-4 py-3">Transparent PNG generation is the primary product path.</div>
            <div className="rounded-2xl border border-white/40 bg-white/40 px-4 py-3">No free tier means every new account starts with a clean, intentional onboarding flow.</div>
          </div>
        </div>
        <div className="flex items-center justify-center p-2">{children}</div>
      </div>
    </div>
  )
}
