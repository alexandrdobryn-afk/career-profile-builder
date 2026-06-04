import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { Topbar } from '@/components/Topbar'

export function LegalPage({ title, updatedAt, children }: {
  title: string
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar showAuth />
      <main style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '34px 24px' }}>
        <Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: 13 }}>
          ← На главную
        </Link>
        <article style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 28,
          marginTop: 16,
        }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 8 }}>
            {title}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>
            Последнее обновление: {updatedAt}
          </p>
          <div className="legal-content">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
