import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProfiles } from '@/lib/queries'

export default async function DashboardPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

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
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.3px' }}>Мои профили</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            Управляйте публичными страницами, резюме, портфолио и сертификатами.
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
          Создать профиль
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
                {profile.is_public ? 'Публичный' : 'Скрыт'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>
              {profile.bio ? profile.bio.slice(0, 82) + (profile.bio.length > 82 ? '...' : '') : profile.role || 'Описание пока не заполнено'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={badgeStyle(profile.resume_file_path ? 'success' : 'warn')}>
                {profile.resume_file_path ? 'Резюме' : 'Нет резюме'}
              </span>
              <span style={badgeStyle()}>{profile.project_count ?? 0} {projectWord(Number(profile.project_count ?? 0))}</span>
              <span style={badgeStyle()}>{profile.certificate_count ?? 0} {certificateWord(Number(profile.certificate_count ?? 0))}</span>
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
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Создать профиль</span>
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

function projectWord(n: number): string {
  if (n === 1) return 'проект'
  if (n >= 2 && n <= 4) return 'проекта'
  return 'проектов'
}

function certificateWord(n: number): string {
  if (n === 1) return 'сертификат'
  if (n >= 2 && n <= 4) return 'сертификата'
  return 'сертификатов'
}
