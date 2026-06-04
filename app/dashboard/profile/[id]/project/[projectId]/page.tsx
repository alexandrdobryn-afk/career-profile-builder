import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ProjectForm } from '@/components/ProjectForm'
import { getCurrentUser } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n-server'
import { getProject, getProfile } from '@/lib/queries'

interface Props {
  params: Promise<{ id: string; projectId: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id, projectId } = await params
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  const lang = await getRequestLang()
  const copy = t(lang)

  const [profile, project] = await Promise.all([
    getProfile(id, session.userId),
    getProject(projectId, session.userId),
  ])
  if (!profile) notFound()
  if (!project) notFound()

  return (
    <>
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text3)' }}>
        <Link href="/dashboard" style={{ color: 'var(--text2)', textDecoration: 'none' }}>{copy.dashboard.myProfiles}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href={`/dashboard/profile/${id}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{profile.title}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--text)' }}>{copy.dashboard.editProject}</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-.3px' }}>
        {copy.dashboard.editProject}
      </h1>
      <ProjectForm profileId={id} project={project} />
    </>
  )
}
