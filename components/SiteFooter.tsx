'use client'

import Link from 'next/link'
import { useLanguage } from './LanguageProvider'

export function SiteFooter() {
  const { lang, copy } = useLanguage()

  return (
    <footer style={{
      borderTop: '0.5px solid var(--border)',
      background: 'var(--surface)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        color: 'var(--text3)',
        fontSize: 12,
      }}>
        <span>© {new Date().getFullYear()} JobProfile</span>
        <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href={`/privacy?lang=${lang}`} style={footerLinkStyle}>{copy.legal.privacyTitle}</Link>
          <Link href={`/terms?lang=${lang}`} style={footerLinkStyle}>{copy.legal.termsTitle}</Link>
        </nav>
      </div>
    </footer>
  )
}

const footerLinkStyle: React.CSSProperties = {
  color: 'var(--text2)',
  textDecoration: 'none',
  fontWeight: 600,
}
