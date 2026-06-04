import { SiteFooter } from '@/components/SiteFooter'
import { Topbar } from '@/components/Topbar'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
      }}>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
