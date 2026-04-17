import { AppHeader } from '@/components/app/layout/header'
import { AppSidebar } from '@/components/app/layout/sidebar'
import { requireCurrentProfile } from '@/lib/clerk/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const { user, profile } = await requireCurrentProfile()

    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <AppSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-60">
          <AppHeader firstName={user.firstName} profile={profile} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    )
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'AUTH_PROFILE_UNAVAILABLE') {
      throw error
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-6">
        <div
          className="max-w-lg rounded-[2rem] p-8 text-center"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 16px 40px rgba(55,101,107,0.08)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#70787a' }}>
            Workspace Unavailable
          </p>
          <h1
            className="mt-3 text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
          >
            We could not load your profile right now.
          </h1>
          <p className="mt-4 text-sm leading-7" style={{ color: '#70787a' }}>
            The app is connected, but the profile request to Supabase did not complete. Refresh the page and try again in a moment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-full px-6 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
            >
              Refresh Workspace
            </a>
            <a
              href="/sign-in"
              className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold"
              style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    )
  }
}
