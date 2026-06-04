'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'
import { logoutAction } from '@/lib/actions'
import { languages, Lang } from '@/lib/i18n'
import { useLanguage } from './LanguageProvider'
import { useTheme } from './ThemeProvider'

interface TopbarProps {
  showAuth?: boolean
  showDashboard?: boolean
  showLogout?: boolean
}

export function Topbar(props: TopbarProps) {
  return (
    <Suspense fallback={<TopbarShell {...props} />}>
      <TopbarContent {...props} />
    </Suspense>
  )
}

function TopbarContent({ showAuth, showDashboard, showLogout }: TopbarProps) {
  const { theme, toggle } = useTheme()
  const { lang, setLang, copy } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const q = query.trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}&lang=${lang}` : `/?lang=${lang}`)
  }

  return (
    <header className="topbar" style={{
      background: 'var(--surface)',
      borderBottom: '0.5px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      padding: '0 18px',
      minHeight: '58px',
      display: 'grid',
      gridTemplateColumns: 'auto minmax(220px, 520px) auto',
      alignItems: 'center',
      gap: 14,
    }}>
      <Link href={`/?lang=${lang}`} style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.2px', color: 'var(--accent)' }}>
          JobProfile
        </span>
      </Link>

      <form className="topbar-search" onSubmit={submitSearch} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 6 }}>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={copy.nav.searchPlaceholder}
          style={{ height: 34, fontSize: 13, padding: '7px 10px' }}
        />
        <button type="submit" style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 0,
          borderRadius: 'var(--radius-sm)',
          padding: '0 13px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          {copy.nav.search}
        </button>
      </form>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={toggle}
          aria-label={copy.nav.theme}
          title={copy.nav.theme}
          style={{
            background: 'var(--surface2)',
            border: '0.5px solid var(--border)',
            borderRadius: 999,
            width: 42,
            height: 26,
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: theme === 'light' ? 'flex-start' : 'flex-end',
            cursor: 'pointer',
          }}
        >
          <span style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme === 'light' ? '#FFD166' : '#353A75',
            color: theme === 'light' ? '#5A3900' : '#C9CCFF',
            fontSize: 12,
            fontWeight: 800,
            boxShadow: '0 1px 5px rgba(0,0,0,.18)',
          }}>
            {theme === 'light' ? '☀' : '☾'}
          </span>
        </button>

        <select
          aria-label={copy.nav.language}
          title={copy.nav.language}
          value={lang}
          onChange={event => setLang(event.target.value as Lang)}
          style={{
            width: 72,
            height: 32,
            padding: '4px 8px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {languages.map(language => (
            <option key={language.code} value={language.code}>
              {language.shortLabel}
            </option>
          ))}
        </select>

        {showDashboard && (
          <Link href="/dashboard" style={navLinkStyle}>
            {copy.nav.dashboard}
          </Link>
        )}

        {showAuth && (
          <>
            <Link href="/login" style={navLinkStyle}>
              {copy.nav.login}
            </Link>
            <Link href="/register" style={{
              ...navLinkStyle,
              background: 'var(--accent)',
              borderColor: 'var(--accent)',
              color: '#fff',
            }}>
              {copy.nav.register}
            </Link>
          </>
        )}

        {showLogout && (
          <form action={logoutAction}>
            <button type="submit" style={{
              background: 'transparent',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text2)',
            }}>
              {copy.nav.logout}
            </button>
          </form>
        )}
      </div>
    </header>
  )
}

function TopbarShell({ showAuth, showDashboard, showLogout }: TopbarProps) {
  return (
    <header className="topbar topbar-shell" style={{
      background: 'var(--surface)',
      borderBottom: '0.5px solid var(--border)',
      minHeight: '58px',
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>JobProfile</span>
      </Link>
      <div className="topbar-actions" style={{ display: 'flex', gap: 8 }}>
        {showDashboard && <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>}
        {showAuth && <Link href="/login" style={navLinkStyle}>Sign in</Link>}
        {showLogout && <span style={navLinkStyle}>...</span>}
      </div>
    </header>
  )
}

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '6px 12px',
  fontSize: 13,
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  background: 'transparent',
  whiteSpace: 'nowrap',
}
