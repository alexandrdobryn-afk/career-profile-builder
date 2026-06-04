import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n-server'
import { getProfiles } from '@/lib/queries'

export default async function DashboardPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  const lang = await getRequestLang()
  const copy = t(lang)

  const profiles = getProfiles(session.userId)

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.3px' }}>{copy.dashboard.myProfiles}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            {copy.dashboard.manageProfiles}
          </p>
        </div>
        <Link href="/dashboard/profile/new" style={{
          background: 'var(--accent)',
          color: '#fff',
          textDecoration: 'none',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {copy.dashboard.createProfile}
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 14,
      }}>
        {profiles.map(profile => (
          <Link key={profile.id} href={`/dashboard/profile/${profile.id}`} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{profile.title}</div>
              <span style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 20,
                background: profile.is_public ? 'var(--success-bg)' : 'var(--warn-bg)',
                color: profile.is_public ? 'var(--success-text)' : 'var(--warn-text)',
                flexShrink: 0,
              }}>
                {profile.is_public ? copy.dashboard.published : copy.dashboard.hidden}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>
              {profile.bio ? profile.bio.slice(0, 82) + (profile.bio.length > 82 ? '...' : '') : profile.role || copy.dashboard.descriptionEmpty}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={badgeStyle(profile.resume_file_path ? 'success' : 'warn')}>
                {profile.resume_file_path ? copy.dashboard.resume : copy.dashboard.noResume}
              </span>
              <span style={badgeStyle()}>{profile.project_count ?? 0} {wordForm(Number(profile.project_count ?? 0), copy.dashboard.projectWord)}</span>
              <span style={badgeStyle()}>{profile.certificate_count ?? 0} {wordForm(Number(profile.certificate_count ?? 0), copy.dashboard.certificateWord)}</span>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 12 }}>/p/{profile.public_slug}</div>
          </Link>
        ))}

        <Link href="/dashboard/profile/new" style={{
          ...cardStyle,
          border: '0.5px dashed var(--border)',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 170,
        }}>
          <span style={{ fontSize: 24, color: 'var(--text3)' }}>+</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{copy.dashboard.createProfile}</span>
        </Link>
      </div>
    </>
  )
}

function badgeStyle(type?: 'success' | 'warn'): React.CSSProperties {
  return {
    fontSize: 11,
    padding: '3px 9px',
    borderRadius: 20,
    fontWeight: 500,
    background: type === 'success' ? 'var(--success-bg)' : type === 'warn' ? 'var(--warn-bg)' : 'var(--surface2)',
    color: type === 'success' ? 'var(--success-text)' : type === 'warn' ? 'var(--warn-text)' : 'var(--text2)',
  }
}

function wordForm(n: number, forms: readonly string[]): string {
  if (forms[0] === forms[1]) return n === 1 ? forms[0] : forms[2]
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}
