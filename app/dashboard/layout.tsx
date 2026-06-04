import { Topbar } from '@/components/Topbar'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar showLogout />
      <main className="page-shell dashboard-shell" style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </main>
    </div>
  )
}
