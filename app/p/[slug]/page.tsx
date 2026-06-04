import Image from 'next/image'
import { notFound } from 'next/navigation'
import { PublicPortfolio } from '@/components/PublicPortfolio'
import { SiteFooter } from '@/components/SiteFooter'
import { Topbar } from '@/components/Topbar'
import { t } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n-server'
import {
  getPublicCertificates,
  getPublicProfile,
  getPublicProfileLinks,
  getPublicProjects,
  getAvatarUrl,
  getResumePublicUrl,
} from '@/lib/queries'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 22,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.5px',
  color: 'var(--text3)',
  marginBottom: 14,
}

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { lang: langParam } = await searchParams
  const lang = await getRequestLang(langParam)
  const copy = t(lang)
  const profile = await getPublicProfile(slug)
  if (!profile) notFound()

  const [projects, certificates, links] = await Promise.all([
    getPublicProjects(profile.id),
    getPublicCertificates(profile.id),
    getPublicProfileLinks(profile.id),
  ])
  const resumeUrl = getResumePublicUrl(profile)
  const avatarUrl = getAvatarUrl(profile)
  const skills = profile.skills ? profile.skills.split(',').map(skill => skill.trim()).filter(Boolean) : []
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.title
  const hasInfo = Boolean(profile.bio || skills.length > 0)
  const hasContacts = Boolean(profile.contact_email)
  const hasActions = Boolean(resumeUrl || projects.length > 0)
  const hasSidebar = hasActions || hasContacts || links.length > 0

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar showAuth />
      <main style={{ flex: 1, maxWidth: 1040, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        <section style={{
          ...card,
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: avatarUrl ? 'minmax(0,1fr) 220px' : 'minmax(0,1fr)',
          gap: 18,
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.6px', marginBottom: 6 }}>{name}</h1>
            <div style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>{profile.title}</div>
            {profile.role && <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 6 }}>{profile.role}</div>}
            {profile.location && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{profile.location}</div>}
          </div>
          {avatarUrl && (
            <div style={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              overflow: 'hidden',
              justifySelf: 'center',
              background: 'var(--surface2)',
              border: '0.5px solid var(--border)',
              boxShadow: '0 12px 34px rgba(0,0,0,.18)',
            }}>
              <Image
                src={avatarUrl}
                alt={name}
                width={220}
                height={220}
                unoptimized
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </section>

        <div style={{
          display: 'grid',
          gridTemplateColumns: hasSidebar ? 'minmax(0,1fr) 300px' : 'minmax(0,1fr)',
          gap: 16,
          alignItems: 'start',
        }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {hasInfo && (
              <section style={card}>
                <div style={sectionTitle}>{copy.public.info}</div>
                {profile.bio && <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text2)', marginBottom: 16 }}>{profile.bio}</p>}
                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {skills.map(skill => (
                      <span key={skill} style={{
                        fontSize: 12,
                        background: 'var(--surface2)',
                        border: '0.5px solid var(--border)',
                        color: 'var(--text2)',
                        padding: '5px 10px',
                        borderRadius: 20,
                      }}>{skill}</span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {projects.length > 0 && (
              <PublicPortfolio
                projects={projects}
                labels={{
                  title: copy.public.portfolio,
                  showAll: copy.public.showAllProjects,
                  collapse: copy.public.collapseProjects,
                  openPdf: copy.public.openPdf,
                }}
              />
            )}

            {certificates.length > 0 && (
              <section style={card}>
                <div style={sectionTitle}>{copy.public.certificates}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {certificates.map(certificate => (
                    <article key={certificate.id} style={{
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: 14,
                    }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{certificate.title}</h3>
                      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8 }}>
                        {[certificate.issuer, certificate.issued_at].filter(Boolean).join(' · ')}
                      </div>
                      {certificate.description && <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.55, marginBottom: 8 }}>{certificate.description}</p>}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {certificate.credential_url && <a href={certificate.credential_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>{copy.public.verify}</a>}
                        {certificate.public_url && <a href={certificate.public_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>{copy.public.openFile}</a>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {hasSidebar && (
            <aside style={{ display: 'grid', gap: 16 }}>
              {hasActions && (
                <section style={card}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {resumeUrl && (
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        textDecoration: 'none',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 14,
                        fontWeight: 800,
                        textAlign: 'center',
                      }}>
                        {copy.public.resume}
                      </a>
                    )}
                    {projects.length > 0 && (
                      <a href="#portfolio" style={{
                        color: 'var(--text)',
                        textDecoration: 'none',
                        padding: '11px 14px',
                        border: '0.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 14,
                        fontWeight: 800,
                        textAlign: 'center',
                      }}>
                        {copy.public.viewPortfolio}
                      </a>
                    )}
                  </div>
                </section>
              )}

              {links.length > 0 && (
                <section style={card}>
                  <div style={sectionTitle}>{copy.dashboard.links}</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {links.map(link => (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 700,
                      }}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {hasContacts && (
                <section style={card}>
                  <div style={sectionTitle}>{copy.public.contacts}</div>
                  <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                    {profile.contact_email && <a href={`mailto:${profile.contact_email}`} style={{ color: 'var(--accent)' }}>{profile.contact_email}</a>}
                  </div>
                </section>
              )}

            </aside>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
