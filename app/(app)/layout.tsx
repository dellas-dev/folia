import { AppHeader } from '@/components/app/layout/header'
import { AppSidebar } from '@/components/app/layout/sidebar'
import { requireCurrentProfile } from '@/lib/clerk/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireCurrentProfile()

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader firstName={user.firstName} profile={profile} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
