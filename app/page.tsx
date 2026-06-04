import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { Topbar } from '@/components/Topbar'
import { getCurrentUser } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n-server'
import { searchPublicProfiles } from '@/lib/queries'

interface Props {
  searchParams: Promise<{ q?: string; lang?: string }>
}

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 24,
}

export default async function HomePage({ searchParams }: Props) {
  const { q = '', lang: langParam } = await searchParams
  const query = q.trim()
  const lang = await getRequestLang(langParam)
  const copy = t(lang)
  const session = await getCurrentUser()
  const profiles = query ? searchPublicProfiles(query) : []

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar showAuth={!session} showDashboard={!!session} />
      <main style={{ flex: 1, maxWidth: 1080, width: '100%', margin: '0 auto', padding: '34px 24px' }}>
        {!query ? (
          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ ...panel, padding: 30 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 12 }}>
                {copy.home.aboutTitle}
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: 16, maxWidth: 760, lineHeight: 1.65 }}>
                {copy.home.aboutText}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <article style={panel}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{copy.home.howTitle}</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>{copy.home.howText}</p>
              </article>
              <article style={panel}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{copy.home.usefulTitle}</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>{copy.home.usefulText}</p>
              </article>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[copy.home.resumeFeature, copy.home.portfolioFeature, copy.home.certificatesFeature].map(item => (
                <div key={item} style={{
                  ...panel,
                  padding: 18,
                  color: 'var(--text2)',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {item}
                </div>
              ))}
            </div>

            {session && (
              <Link href="/dashboard/profile/new" style={{
                justifySelf: 'start',
                color: '#fff',
                background: 'var(--accent)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}>
                {copy.home.create}
              </Link>
            )}
          </section>
        ) : (
          <section>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              gap: 12,
            }}>
              <h1 style={{ fontSize: 20, fontWeight: 800 }}>
                {copy.home.results}: {profiles.length}
              </h1>
              {session && (
                <Link href="/dashboard/profile/new" style={{
                  color: 'var(--accent)',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  {copy.home.create}
                </Link>
              )}
            </div>

            {profiles.length === 0 ? (
              <div style={{
                background: 'var(--surface)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 28,
                color: 'var(--text2)',
                fontSize: 14,
              }}>
                {copy.home.empty}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 14,
              }}>
                {profiles.map(profile => {
                  const skills = profile.skills ? profile.skills.split(',').map(skill => skill.trim()).filter(Boolean).slice(0, 5) : []
                  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.title

                  return (
                    <Link key={profile.id} href={`/p/${profile.public_slug}?lang=${lang}`} style={{
                      background: 'var(--surface)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: 18,
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>{name}</div>
                      <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>{profile.title}</div>
                      {profile.role && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>{profile.role}</div>}
                      {profile.bio && (
                        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>
                          {profile.bio.slice(0, 130)}{profile.bio.length > 130 ? '...' : ''}
                        </p>
                      )}
                      {skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {skills.map(skill => (
                            <span key={skill} style={{
                              fontSize: 11,
                              background: 'var(--surface2)',
                              border: '0.5px solid var(--border)',
                              color: 'var(--text2)',
                              padding: '3px 8px',
                              borderRadius: 20,
                            }}>{skill}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, color: 'var(--text3)', fontSize: 11, flexWrap: 'wrap' }}>
                        {(profile.project_count ?? 0) > 0 && <span>{profile.project_count} {copy.home.projects}</span>}
                        {(profile.certificate_count ?? 0) > 0 && <span>{profile.certificate_count} {copy.home.certificates}</span>}
                        {profile.resume_file_path && <span>{copy.home.resume}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
