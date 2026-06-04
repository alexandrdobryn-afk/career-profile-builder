import { getAll, getDb, getOne } from './db'
import { getPublicFilePath } from './files'

export interface Profile {
  id: string
  user_id: string
  title: string
  public_slug: string
  is_public: number
  first_name: string
  last_name: string
  role: string
  bio: string
  skills: string
  location: string
  contact_email: string
  website_url: string
  avatar_file_path: string | null
  avatar_file_name: string | null
  avatar_uploaded_at: string | null
  show_resume_public: number
  resume_file_path: string | null
  resume_file_name: string | null
  resume_uploaded_at: string | null
  created_at: string
  project_count?: number
  certificate_count?: number
}

export interface ProfileLink {
  id: string
  career_profile_id: string
  label: string
  url: string
  is_public: number
  sort_order: number
  created_at: string
}

export interface Project {
  id: string
  career_profile_id: string
  title: string
  role: string
  description: string
  skills: string
  project_url: string
  created_at: string
  files?: ProjectFile[]
  links?: ProjectLink[]
}

export interface ProjectFile {
  id: string
  file_path: string
  file_name: string
  file_type: string
  public_url: string
}

export interface ProjectLink {
  id: string
  project_id: string
  label: string
  url: string
  sort_order: number
  created_at: string
}

export interface Certificate {
  id: string
  career_profile_id: string
  title: string
  issuer: string
  issued_at: string
  credential_url: string
  description: string
  file_path: string | null
  file_name: string | null
  file_type: string | null
  public_url?: string | null
  created_at: string
}

export async function getProfiles(userId: string): Promise<Profile[]> {
  const db = await getDb()
  return getAll<Profile>(db, `
    SELECT
      cp.*,
      COUNT(DISTINCT pp.id) as project_count,
      COUNT(DISTINCT c.id) as certificate_count
    FROM career_profiles cp
    LEFT JOIN portfolio_projects pp ON pp.career_profile_id = cp.id
    LEFT JOIN certificates c ON c.career_profile_id = cp.id
    WHERE cp.user_id = ?
    GROUP BY cp.id
    ORDER BY cp.created_at ASC
  `, [userId])
}

export async function searchPublicProfiles(query?: string): Promise<Profile[]> {
  const db = await getDb()
  const q = query?.trim()

  if (!q) {
    return getAll<Profile>(db, `
      SELECT
        cp.*,
        COUNT(DISTINCT pp.id) as project_count,
        COUNT(DISTINCT c.id) as certificate_count
      FROM career_profiles cp
      LEFT JOIN portfolio_projects pp ON pp.career_profile_id = cp.id
      LEFT JOIN certificates c ON c.career_profile_id = cp.id
      WHERE cp.is_public = 1
      GROUP BY cp.id
      ORDER BY cp.updated_at DESC
      LIMIT 24
    `)
  }

  const terms = q
    .split(/\s+/)
    .map(term => term.trim())
    .filter(Boolean)
    .slice(0, 6)

  const fields = [
    'cp.title',
    'cp.role',
    'cp.skills',
    'cp.bio',
    'cp.first_name',
    'cp.last_name',
    "cp.first_name || ' ' || cp.last_name",
    'cp.location',
    'pp.title',
    'pp.description',
    'pp.skills',
    'pjl.label',
    'pjl.url',
    'c.title',
    'c.issuer',
    'c.description',
    'pl.label',
    'pl.url',
  ]

  const where = terms
    .map(() => `(${fields.map(field => `${field} LIKE ?`).join(' OR ')})`)
    .join(' OR ')

  const params = terms.flatMap(term => fields.map(() => `%${term}%`))

  return getAll<Profile>(db, `
    SELECT
      cp.*,
      COUNT(DISTINCT pp.id) as project_count,
      COUNT(DISTINCT c.id) as certificate_count
    FROM career_profiles cp
    LEFT JOIN portfolio_projects pp ON pp.career_profile_id = cp.id
    LEFT JOIN project_links pjl ON pjl.project_id = pp.id
    LEFT JOIN certificates c ON c.career_profile_id = cp.id
    LEFT JOIN profile_links pl ON pl.career_profile_id = cp.id AND pl.is_public = 1
    WHERE cp.is_public = 1
      AND (${where})
    GROUP BY cp.id
    ORDER BY cp.updated_at DESC
    LIMIT 50
  `, params)
}

export async function getProfile(profileId: string, userId: string): Promise<Profile | null> {
  const db = await getDb()
  return getOne<Profile>(db, 'SELECT * FROM career_profiles WHERE id = ? AND user_id = ?', [profileId, userId])
}

export async function getPublicProfile(slug: string): Promise<Profile | null> {
  const db = await getDb()
  return getOne<Profile>(db, 'SELECT * FROM career_profiles WHERE public_slug = ? AND is_public = 1', [slug])
}

export async function getProfileLinks(profileId: string, userId: string): Promise<ProfileLink[]> {
  const db = await getDb()
  return getAll<ProfileLink>(db, `
    SELECT * FROM profile_links
    WHERE career_profile_id = ? AND user_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `, [profileId, userId])
}

export async function getPublicProfileLinks(profileId: string): Promise<ProfileLink[]> {
  const db = await getDb()
  return getAll<ProfileLink>(db, `
    SELECT pl.*
    FROM profile_links pl
    JOIN career_profiles cp ON cp.id = pl.career_profile_id
    WHERE pl.career_profile_id = ? AND pl.is_public = 1 AND cp.is_public = 1
    ORDER BY pl.sort_order ASC, pl.created_at ASC
  `, [profileId])
}

export async function getProjects(profileId: string, userId: string): Promise<Project[]> {
  const db = await getDb()
  const projects = await getAll<Project>(db, `
    SELECT * FROM portfolio_projects
    WHERE career_profile_id = ? AND user_id = ?
    ORDER BY created_at ASC
  `, [profileId, userId])

  return attachProjectFiles(projects)
}

export async function getPublicProjects(profileId: string): Promise<Project[]> {
  const db = await getDb()
  const projects = await getAll<Project>(db, `
    SELECT pp.*
    FROM portfolio_projects pp
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pp.career_profile_id = ? AND cp.is_public = 1
    ORDER BY pp.created_at ASC
  `, [profileId])

  return attachProjectFiles(projects)
}

async function attachProjectFiles(projects: Project[]): Promise<Project[]> {
  const db = await getDb()

  return Promise.all(projects.map(async project => ({
    ...project,
    files: (await getAll<Omit<ProjectFile, 'public_url'>>(db, 'SELECT * FROM project_files WHERE project_id = ?', [project.id]))
      .map(file => ({ ...file, public_url: getPublicFilePath(file.file_path) })),
    links: await getAll<ProjectLink>(db, `
      SELECT * FROM project_links
      WHERE project_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `, [project.id]),
  })))
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const db = await getDb()
  const project = await getOne<Project>(db, 'SELECT * FROM portfolio_projects WHERE id = ? AND user_id = ?', [projectId, userId])
  if (!project) return null
  return (await attachProjectFiles([project]))[0]
}

export async function getCertificates(profileId: string, userId: string): Promise<Certificate[]> {
  const db = await getDb()
  const certificates = await getAll<Certificate>(db, `
    SELECT * FROM certificates
    WHERE career_profile_id = ? AND user_id = ?
    ORDER BY created_at DESC
  `, [profileId, userId])

  return attachCertificateFiles(certificates)
}

export async function getPublicCertificates(profileId: string): Promise<Certificate[]> {
  const db = await getDb()
  const certificates = await getAll<Certificate>(db, `
    SELECT c.*
    FROM certificates c
    JOIN career_profiles cp ON cp.id = c.career_profile_id
    WHERE c.career_profile_id = ? AND cp.is_public = 1
    ORDER BY c.created_at DESC
  `, [profileId])

  return attachCertificateFiles(certificates)
}

function attachCertificateFiles(certificates: Certificate[]): Certificate[] {
  return certificates.map(certificate => ({
    ...certificate,
    public_url: certificate.file_path ? getPublicFilePath(certificate.file_path) : null,
  }))
}

export function getResumePublicUrl(profile: Profile): string | null {
  if (profile.show_resume_public !== 1) return null
  if (!profile.resume_file_path) return null
  return getPublicFilePath(profile.resume_file_path)
}

export function getResumeDashboardUrl(profile: Profile): string | null {
  if (!profile.resume_file_path) return null
  return getPublicFilePath(profile.resume_file_path)
}

export function getAvatarUrl(profile: Profile): string | null {
  if (!profile.avatar_file_path) return null
  return getPublicFilePath(profile.avatar_file_path)
}
