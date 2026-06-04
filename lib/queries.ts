import { getDb } from './db'
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

export function getProfiles(userId: string): Profile[] {
  const db = getDb()
  return db.prepare(`
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
  `).all(userId) as Profile[]
}

export function searchPublicProfiles(query?: string): Profile[] {
  const db = getDb()
  const q = query?.trim()

  if (!q) {
    return db.prepare(`
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
    `).all() as Profile[]
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

  return db.prepare(`
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
  `).all(...params) as Profile[]
}

export function getProfile(profileId: string, userId: string): Profile | null {
  const db = getDb()
  return db.prepare('SELECT * FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, userId) as Profile | null
}

export function getPublicProfile(slug: string): Profile | null {
  const db = getDb()
  return db.prepare('SELECT * FROM career_profiles WHERE public_slug = ? AND is_public = 1').get(slug) as Profile | null
}

export function getProfileLinks(profileId: string, userId: string): ProfileLink[] {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM profile_links
    WHERE career_profile_id = ? AND user_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `).all(profileId, userId) as ProfileLink[]
}

export function getPublicProfileLinks(profileId: string): ProfileLink[] {
  const db = getDb()
  return db.prepare(`
    SELECT pl.*
    FROM profile_links pl
    JOIN career_profiles cp ON cp.id = pl.career_profile_id
    WHERE pl.career_profile_id = ? AND pl.is_public = 1 AND cp.is_public = 1
    ORDER BY pl.sort_order ASC, pl.created_at ASC
  `).all(profileId) as ProfileLink[]
}

export function getProjects(profileId: string, userId: string): Project[] {
  const db = getDb()
  const projects = db.prepare(`
    SELECT * FROM portfolio_projects
    WHERE career_profile_id = ? AND user_id = ?
    ORDER BY created_at ASC
  `).all(profileId, userId) as Project[]

  return attachProjectFiles(projects)
}

export function getPublicProjects(profileId: string): Project[] {
  const db = getDb()
  const projects = db.prepare(`
    SELECT pp.*
    FROM portfolio_projects pp
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pp.career_profile_id = ? AND cp.is_public = 1
    ORDER BY pp.created_at ASC
  `).all(profileId) as Project[]

  return attachProjectFiles(projects)
}

function attachProjectFiles(projects: Project[]): Project[] {
  const db = getDb()

  return projects.map(project => ({
    ...project,
    files: (db.prepare('SELECT * FROM project_files WHERE project_id = ?').all(project.id) as Omit<ProjectFile, 'public_url'>[])
      .map(file => ({ ...file, public_url: getPublicFilePath(file.file_path) })),
    links: db.prepare(`
      SELECT * FROM project_links
      WHERE project_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `).all(project.id) as ProjectLink[],
  }))
}

export function getProject(projectId: string, userId: string): Project | null {
  const db = getDb()
  const project = db.prepare('SELECT * FROM portfolio_projects WHERE id = ? AND user_id = ?').get(projectId, userId) as Project | null
  if (!project) return null
  return attachProjectFiles([project])[0]
}

export function getCertificates(profileId: string, userId: string): Certificate[] {
  const db = getDb()
  const certificates = db.prepare(`
    SELECT * FROM certificates
    WHERE career_profile_id = ? AND user_id = ?
    ORDER BY created_at DESC
  `).all(profileId, userId) as Certificate[]

  return attachCertificateFiles(certificates)
}

export function getPublicCertificates(profileId: string): Certificate[] {
  const db = getDb()
  const certificates = db.prepare(`
    SELECT c.*
    FROM certificates c
    JOIN career_profiles cp ON cp.id = c.career_profile_id
    WHERE c.career_profile_id = ? AND cp.is_public = 1
    ORDER BY c.created_at DESC
  `).all(profileId) as Certificate[]

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
