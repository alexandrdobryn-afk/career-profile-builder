import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAvatarUrl, getCertificates, getProfile, getProfileLinks, getProjects, getResumeDashboardUrl } from '@/lib/queries'
import { AvatarUpload } from '@/components/AvatarUpload'
import { CertificateForm } from '@/components/CertificateForm'
import { DeleteCertificateButton } from '@/components/DeleteCertificateButton'
import { DeleteProjectButton } from '@/components/DeleteProjectButton'
import { ProfileLinksManager } from '@/components/ProfileLinksManager'
import { ResumeUpload } from '@/components/ResumeUpload'
import { t } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n-server'

interface Props {
  params: Promise<{ id: string }>
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '20px',
  marginBottom: 14,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.5px',
  color: 'var(--text3)',
  marginBottom: 14,
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  const lang = await getRequestLang()
  const copy = t(lang)

  const profile = await getProfile(id, session.userId)
  if (!profile) notFound()

  const [projects, certificates, profileLinks] = await Promise.all([
    getProjects(id, session.userId),
    getCertificates(id, session.userId),
    getProfileLinks(id, session.userId),
  ])
  const resumeUrl = getResumeDashboardUrl(profile)
  const avatarUrl = getAvatarUrl(profile)
  const skillsList = profile.skills ? profile.skills.split(',').map(skill => skill.trim()).filter(Boolean) : []
  const publicUrl = `/p/${profile.public_slug}`

  const resumeDate = profile.resume_uploaded_at
    ? new Date(profile.resume_uploaded_at).toLocaleDateString(copy.dashboard.locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text3)' }}>
        <Link href="/dashboard" style={{ color: 'var(--text2)', textDecoration: 'none' }}>{copy.dashboard.myProfiles}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--text)' }}>{profile.title}</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 290px',
        gap: 20,
        alignItems: 'start',
      }}>
        <div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.3px' }}>
                  {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.title}
                </h1>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginTop: 3 }}>{profile.title}</div>
                {profile.role && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{profile.role}</div>}
                {profile.location && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{profile.location}</div>}
              </div>
              <Link href={`/dashboard/profile/${id}/edit`} style={{
                padding: '6px 14px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'var(--text2)',
                textDecoration: 'none',
                flexShrink: 0,
              }}>
                {copy.dashboard.edit}
              </Link>
            </div>

            <div style={{
              background: profile.is_public ? 'var(--success-bg)' : 'var(--warn-bg)',
              color: profile.is_public ? 'var(--success-text)' : 'var(--warn-text)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 12,
              marginBottom: 14,
            }}>
              {profile.is_public ? copy.dashboard.profilePublished : copy.dashboard.profileHidden}: <Link href={publicUrl} target="_blank" style={{ color: 'inherit', fontWeight: 700 }}>{publicUrl}</Link>
            </div>

            {profile.bio && (
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14 }}>
                {profile.bio}
              </p>
            )}

            {skillsList.length > 0 && (
              <>
                <div style={sectionTitle}>{copy.dashboard.skills}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {skillsList.map(skill => (
                    <span key={skill} style={{
                      fontSize: 11,
                      background: 'var(--surface2)',
                      border: '0.5px solid var(--border)',
                      color: 'var(--text2)',
                      padding: '4px 10px',
                      borderRadius: 20,
                    }}>{skill}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={sectionTitle}>{copy.dashboard.portfolio}</div>
              <Link href={`/dashboard/profile/${id}/project/new`} style={{
                background: 'var(--accent)',
                color: '#fff',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 500,
              }}>
                {copy.dashboard.addProject}
              </Link>
            </div>

            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>
                {copy.dashboard.noProjects}
              </div>
            ) : (
              projects.map(project => {
                const projSkills = project.skills ? project.skills.split(',').map(skill => skill.trim()).filter(Boolean) : []
                const imageFile = project.files?.find(file => file.file_type.startsWith('image/'))
                const documentFile = project.files?.find(file => file.file_type === 'application/pdf')

                return (
                  <div key={project.id} style={{
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 16,
                    marginBottom: 10,
                  }}>
                    {imageFile && (
                      <div style={{
                        marginBottom: 10,
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        background: 'var(--surface2)',
                        height: 160,
                      }}>
                        <Image
                          src={imageFile.public_url}
                          alt={project.title}
                          width={700}
                          height={320}
                          unoptimized
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{project.title}</div>
                        {project.role && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{project.role}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Link href={`/dashboard/profile/${id}/project/${project.id}`} style={{
                          background: 'transparent',
                          border: '0.5px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '5px 10px',
                          fontSize: 12,
                          color: 'var(--text2)',
                          textDecoration: 'none',
                        }}>
                          {copy.dashboard.change}
                        </Link>
                        <DeleteProjectButton projectId={project.id} profileId={id} />
                      </div>
                    </div>
                    {project.description && <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 8 }}>{project.description}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {projSkills.map(skill => (
                        <span key={skill} style={{
                          fontSize: 11,
                          background: 'var(--surface2)',
                          border: '0.5px solid var(--border)',
                          color: 'var(--text2)',
                          padding: '3px 9px',
                          borderRadius: 20,
                        }}>{skill}</span>
                      ))}
                      {project.links?.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}
                        >
                          {link.label}
                        </a>
                      ))}
                      {documentFile && <a href={documentFile.public_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)' }}>PDF</a>}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <ProfileLinksManager profileId={id} links={profileLinks} />

          <div style={card}>
            <div style={sectionTitle}>{copy.dashboard.certificatesTitle}</div>
            {certificates.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {certificates.map(certificate => (
                  <div key={certificate.id} style={{
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 14,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{certificate.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          {[certificate.issuer, certificate.issued_at].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <DeleteCertificateButton certificateId={certificate.id} profileId={id} />
                    </div>
                    {certificate.description && <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginTop: 8 }}>{certificate.description}</p>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      {certificate.credential_url && <a href={certificate.credential_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>{copy.dashboard.verify}</a>}
                      {certificate.public_url && <a href={certificate.public_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>{copy.dashboard.file}</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <CertificateForm profileId={id} />
          </div>
        </div>

        <aside>
          <div style={card}>
            <div style={sectionTitle}>{copy.dashboard.profilePhoto}</div>
            <AvatarUpload
              profileId={id}
              currentAvatar={avatarUrl ? {
                url: avatarUrl,
                name: profile.avatar_file_name || 'profile-photo',
              } : null}
            />
          </div>

          <div style={card}>
            <div style={sectionTitle}>{copy.dashboard.resume}</div>
            <ResumeUpload
              profileId={id}
              currentResume={resumeUrl ? {
                name: profile.resume_file_name!,
                date: resumeDate!,
                url: resumeUrl,
                isPublic: profile.show_resume_public === 1,
              } : null}
            />
          </div>

          <div style={card}>
            <div style={sectionTitle}>{copy.dashboard.information}</div>
            {[
              [copy.dashboard.status, profile.is_public ? copy.dashboard.published : copy.dashboard.hidden],
              [copy.dashboard.projects, String(projects.length)],
              [copy.dashboard.certificates, String(certificates.length)],
              [copy.dashboard.created, new Date(profile.created_at).toLocaleDateString(copy.dashboard.locale)],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                padding: '8px 0',
                borderBottom: '0.5px solid var(--border)',
                fontSize: 12,
              }}>
                <span style={{ color: 'var(--text3)' }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  )
}
