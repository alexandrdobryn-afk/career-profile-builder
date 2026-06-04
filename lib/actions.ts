'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie, clearSessionCookie, getCurrentUser } from './auth'
import { batch, createUniqueSlug, generateId, getDb, getOne, run, slugify } from './db'
import {
  clearDirectory,
  deleteDirectory,
  getAvatarPath,
  getCertificatePath,
  getProfilePath,
  getProjectPath,
  getResumePath,
  saveFile,
  validateFile,
} from './files'

type ActionResult = { error?: string; success?: boolean } | undefined
type OwnedProfile = { id: string; public_slug: string }
const MAX_PROJECT_FILES = 5

export async function registerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!email || !password) return { error: 'Fill in all fields' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }
  if (password !== confirm) return { error: 'Passwords do not match' }

  const db = await getDb()
  const existing = await getOne<{ id: string }>(db, 'SELECT id FROM users WHERE email = ?', [email])
  if (existing) return { error: 'User with this email already exists' }

  const hash = await bcrypt.hash(password, 12)
  const id = generateId()
  await run(db, 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, hash])

  const token = await createSession({ userId: id, email })
  await setSessionCookie(token)
  redirect('/dashboard')
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Fill in all fields' }

  const db = await getDb()
  const user = await getOne<{ id: string; email: string; password_hash: string }>(
    db,
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email],
  )

  if (!user) return { error: 'Invalid email or password' }

  if (!user.password_hash.startsWith('$2')) return { error: 'Use Google sign in for this account' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Invalid email or password' }

  const token = await createSession({ userId: user.id, email: user.email })
  await setSessionCookie(token)
  redirect('/dashboard')
}

export async function logoutAction() {
  await clearSessionCookie()
  redirect('/')
}

export async function createProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Enter profile title' }

  const db = await getDb()
  const id = generateId()
  const requestedSlug = (formData.get('public_slug') as string)?.trim() || title
  const publicSlug = await createUniqueSlug(db, requestedSlug, id)

  await run(db, `
    INSERT INTO career_profiles (
      id, user_id, title, public_slug, is_public,
      first_name, last_name, role, bio, skills, location, contact_email, website_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    session.userId,
    title,
    publicSlug,
    formData.get('is_public') === 'on' ? 1 : 0,
    (formData.get('first_name') as string) || '',
    (formData.get('last_name') as string) || '',
    (formData.get('role') as string) || '',
    (formData.get('bio') as string) || '',
    (formData.get('skills') as string) || '',
    (formData.get('location') as string) || '',
    (formData.get('contact_email') as string) || '',
    (formData.get('website_url') as string) || '',
  ])

  revalidatePath('/')
  revalidatePath('/dashboard')
  redirect(`/dashboard/profile/${id}`)
}

export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const profileId = formData.get('profileId') as string
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Enter profile title' }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  const requestedSlug = (formData.get('public_slug') as string)?.trim() || title
  const publicSlug = await createUniqueSlug(db, requestedSlug, profileId)

  await run(db, `
    UPDATE career_profiles
    SET
      title=?,
      public_slug=?,
      is_public=?,
      first_name=?,
      last_name=?,
      role=?,
      bio=?,
      skills=?,
      location=?,
      contact_email=?,
      website_url=?,
      updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `, [
    title,
    publicSlug,
    formData.get('is_public') === 'on' ? 1 : 0,
    (formData.get('first_name') as string) || '',
    (formData.get('last_name') as string) || '',
    (formData.get('role') as string) || '',
    (formData.get('bio') as string) || '',
    (formData.get('skills') as string) || '',
    (formData.get('location') as string) || '',
    (formData.get('contact_email') as string) || '',
    (formData.get('website_url') as string) || '',
    profileId,
    session.userId,
  ])

  revalidatePath('/')
  revalidatePath(`/p/${profile.public_slug}`)
  revalidatePath(`/p/${publicSlug}`)
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath('/dashboard')
  redirect(`/dashboard/profile/${profileId}`)
}

export async function deleteProfileAction(profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  await run(db, 'DELETE FROM career_profiles WHERE id = ? AND user_id = ?', [profileId, session.userId])
  await deleteDirectory(getProfilePath(session.userId, profileId))

  revalidatePath('/')
  revalidatePath(`/p/${profile.public_slug}`)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function uploadResumeAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Not authorized' }

  const profileId = formData.get('profileId') as string
  const file = formData.get('file') as File

  if (!file || file.size === 0) return { error: 'Choose a file' }

  const validationError = validateFile(file, 'resume')
  if (validationError) return { error: validationError }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  const dirPath = getResumePath(session.userId, profileId)
  await clearDirectory(dirPath)
  const filePath = await saveFile(file, dirPath, 'resume')

  await run(db, `
    UPDATE career_profiles
    SET resume_file_path=?, resume_file_name=?, resume_uploaded_at=datetime('now'), show_resume_public=1, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `, [filePath, file.name, profileId, session.userId])

  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function deleteResumeAction(profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Not authorized' }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  await deleteDirectory(getResumePath(session.userId, profileId))
  await run(db, `
    UPDATE career_profiles
    SET resume_file_path=NULL, resume_file_name=NULL, resume_uploaded_at=NULL, show_resume_public=0, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `, [profileId, session.userId])

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function setResumePublicAction(profileId: string, visible: boolean): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Not authorized' }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  await run(db, `
    UPDATE career_profiles
    SET show_resume_public=?, updated_at=datetime('now')
    WHERE id=? AND user_id=? AND resume_file_path IS NOT NULL
  `, [visible ? 1 : 0, profileId, session.userId])

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Not authorized' }

  const profileId = formData.get('profileId') as string
  const file = formData.get('file') as File

  if (!file || file.size === 0) return { error: 'Choose a photo' }

  const validationError = validateFile(file, 'avatar')
  if (validationError) return { error: validationError }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  const dirPath = getAvatarPath(session.userId, profileId)
  await clearDirectory(dirPath)
  const filePath = await saveFile(file, dirPath, 'avatar')

  await run(db, `
    UPDATE career_profiles
    SET avatar_file_path=?, avatar_file_name=?, avatar_uploaded_at=datetime('now'), updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `, [filePath, file.name, profileId, session.userId])

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function deleteAvatarAction(profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Not authorized' }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  await deleteDirectory(getAvatarPath(session.userId, profileId))
  await run(db, `
    UPDATE career_profiles
    SET avatar_file_path=NULL, avatar_file_name=NULL, avatar_uploaded_at=NULL, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `, [profileId, session.userId])

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function saveProfileLinksAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const profileId = formData.get('profileId') as string
  const linkCount = Number(formData.get('linkCount') || 0)
  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  const links: { label: string; url: string; isPublic: number; sortOrder: number }[] = []
  for (let index = 0; index < linkCount; index += 1) {
    const rawUrl = (formData.get(`url_${index}`) as string | null)?.trim()
    if (!rawUrl) continue

    const url = normalizeUrl(rawUrl)
    if (!url) return { error: 'Check links: only http and https URLs are allowed' }

    const rawLabel = (formData.get(`label_${index}`) as string | null)?.trim()
    links.push({
      label: rawLabel || guessLinkLabel(url),
      url,
      isPublic: formData.get(`public_${index}`) === 'on' ? 1 : 0,
      sortOrder: links.length,
    })
  }

  await batch(db, [
    { sql: 'DELETE FROM profile_links WHERE career_profile_id = ? AND user_id = ?', args: [profileId, session.userId] },
    ...links.map(link => ({
      sql: `
        INSERT INTO profile_links (id, user_id, career_profile_id, label, url, is_public, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [generateId(), session.userId, profileId, link.label, link.url, link.isPublic, link.sortOrder],
    })),
  ])

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function createProjectAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const profileId = formData.get('profileId') as string
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Enter project title' }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  const files = getProjectFiles(formData)
  const fileValidationError = validateProjectFiles(files)
  if (fileValidationError) return { error: fileValidationError }

  const id = generateId()
  const links = collectProjectLinks(formData)
  if (links.error) return { error: links.error }

  await batch(db, [
    {
      sql: `
        INSERT INTO portfolio_projects (id, user_id, career_profile_id, title, role, description, skills, project_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, '')
      `,
      args: [
        id,
        session.userId,
        profileId,
        title,
        (formData.get('role') as string) || '',
        (formData.get('description') as string) || '',
        (formData.get('skills') as string) || '',
      ],
    },
    ...projectLinkStatements(session.userId, id, links.items),
  ])

  for (const file of files) {
    const dirPath = getProjectPath(session.userId, profileId, id)
    const filePath = await saveFile(file, dirPath, `content-${generateId()}`)
    await run(db, `
      INSERT INTO project_files (id, user_id, project_id, file_path, file_name, file_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [generateId(), session.userId, id, filePath, file.name, file.type])
  }

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  redirect(`/dashboard/profile/${profileId}`)
}

export async function updateProjectAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const projectId = formData.get('projectId') as string
  const profileId = formData.get('profileId') as string
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Enter project title' }

  const db = await getDb()
  const project = await getOne<{ id: string; public_slug: string }>(db, `
    SELECT pp.id, cp.public_slug
    FROM portfolio_projects pp
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pp.id = ? AND pp.user_id = ?
  `, [projectId, session.userId])
  if (!project) return { error: 'Project not found' }

  const files = getProjectFiles(formData)
  const fileValidationError = validateProjectFiles(files)
  if (fileValidationError) return { error: fileValidationError }

  const deleteFileIds = collectDeleteFileIds(formData)
  const existingFiles = await getProjectFileRecords(db, projectId, session.userId)
  const deleteFileIdSet = new Set(deleteFileIds)
  const ownedDeleteFiles = existingFiles.filter(file => deleteFileIdSet.has(file.id))
  const remainingFileCount = existingFiles.length - ownedDeleteFiles.length
  if (remainingFileCount + files.length > MAX_PROJECT_FILES) {
    return { error: `A project can have up to ${MAX_PROJECT_FILES} files.` }
  }

  const links = collectProjectLinks(formData)
  if (links.error) return { error: links.error }

  await batch(db, [
    {
      sql: `
        UPDATE portfolio_projects
        SET title=?, role=?, description=?, skills=?, project_url='', updated_at=datetime('now')
        WHERE id=? AND user_id=?
      `,
      args: [
        title,
        (formData.get('role') as string) || '',
        (formData.get('description') as string) || '',
        (formData.get('skills') as string) || '',
        projectId,
        session.userId,
      ],
    },
    { sql: 'DELETE FROM project_links WHERE project_id = ? AND user_id = ?', args: [projectId, session.userId] },
    ...projectLinkStatements(session.userId, projectId, links.items),
  ])

  if (ownedDeleteFiles.length > 0) {
    await Promise.all(ownedDeleteFiles.map(file => deleteDirectory(file.file_path)))
    await batch(db, ownedDeleteFiles.map(file => ({
      sql: 'DELETE FROM project_files WHERE id = ? AND user_id = ?',
      args: [file.id, session.userId],
    })))
  }

  for (const file of files) {
    const dirPath = getProjectPath(session.userId, profileId, projectId)
    const filePath = await saveFile(file, dirPath, `content-${generateId()}`)
    await run(db, `
      INSERT INTO project_files (id, user_id, project_id, file_path, file_name, file_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [generateId(), session.userId, projectId, filePath, file.name, file.type])
  }

  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${project.public_slug}`)
  redirect(`/dashboard/profile/${profileId}`)
}

export async function deleteProjectAction(projectId: string, profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const db = await getDb()
  const project = await getOne<{ id: string; public_slug: string }>(db, `
    SELECT pp.id, cp.public_slug
    FROM portfolio_projects pp
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pp.id = ? AND pp.user_id = ?
  `, [projectId, session.userId])
  if (!project) return { error: 'Project not found' }

  await run(db, 'DELETE FROM portfolio_projects WHERE id = ? AND user_id = ?', [projectId, session.userId])
  await deleteDirectory(getProjectPath(session.userId, profileId, projectId))

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${project.public_slug}`)
  return { success: true }
}

export async function createCertificateAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const profileId = formData.get('profileId') as string
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Enter certificate title' }

  const db = await getDb()
  const profile = await getOwnedProfile(db, profileId, session.userId)
  if (!profile) return { error: 'Profile not found' }

  const file = formData.get('file') as File
  if (file && file.size > 0) {
    const validationError = validateFile(file, 'certificate')
    if (validationError) return { error: validationError }
  }

  const id = generateId()
  let filePath: string | null = null
  let fileName: string | null = null
  let fileType: string | null = null

  if (file && file.size > 0) {
    const dirPath = getCertificatePath(session.userId, profileId, id)
    filePath = await saveFile(file, dirPath, 'certificate')
    fileName = file.name
    fileType = file.type || null
  }

  await run(db, `
    INSERT INTO certificates (
      id, user_id, career_profile_id, title, issuer, issued_at,
      credential_url, description, file_path, file_name, file_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    session.userId,
    profileId,
    title,
    (formData.get('issuer') as string) || '',
    (formData.get('issued_at') as string) || '',
    (formData.get('credential_url') as string) || '',
    (formData.get('description') as string) || '',
    filePath,
    fileName,
    fileType,
  ])

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function deleteCertificateAction(certificateId: string, profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const db = await getDb()
  const certificate = await getOne<{ id: string; public_slug: string }>(db, `
    SELECT c.id, cp.public_slug
    FROM certificates c
    JOIN career_profiles cp ON cp.id = c.career_profile_id
    WHERE c.id = ? AND c.user_id = ?
  `, [certificateId, session.userId])
  if (!certificate) return { error: 'Certificate not found' }

  await run(db, 'DELETE FROM certificates WHERE id = ? AND user_id = ?', [certificateId, session.userId])
  await deleteDirectory(getCertificatePath(session.userId, profileId, certificateId))

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${certificate.public_slug}`)
  return { success: true }
}

function normalizeUrl(value: string): string | null {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function guessLinkLabel(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com')) return 'LinkedIn'
  if (lower.includes('github.com')) return 'GitHub'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'Facebook'
  if (lower.includes('instagram.com')) return 'Instagram'
  if (lower.includes('t.me') || lower.includes('telegram')) return 'Telegram'
  return 'Website'
}

function collectProjectLinks(formData: FormData): {
  items: { label: string; url: string; sortOrder: number }[]
  error?: string
} {
  const linkCount = Number(formData.get('linkCount') || 0)
  const items: { label: string; url: string; sortOrder: number }[] = []

  for (let index = 0; index < linkCount; index += 1) {
    const rawUrl = (formData.get(`link_url_${index}`) as string | null)?.trim()
    if (!rawUrl) continue

    const url = normalizeUrl(rawUrl)
    if (!url) {
      return { items: [], error: 'Check project links: only http and https URLs are allowed' }
    }

    const rawLabel = (formData.get(`link_label_${index}`) as string | null)?.trim()
    items.push({
      label: rawLabel || guessLinkLabel(url),
      url,
      sortOrder: items.length,
    })
  }

  return { items }
}

function projectLinkStatements(
  userId: string,
  projectId: string,
  links: { label: string; url: string; sortOrder: number }[],
) {
  return links.map(link => ({
    sql: `
      INSERT INTO project_links (id, user_id, project_id, label, url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [generateId(), userId, projectId, link.label, link.url, link.sortOrder],
  }))
}

function getProjectFiles(formData: FormData): File[] {
  return formData
    .getAll('files')
    .filter((file): file is File => file instanceof File && file.size > 0)
}

function validateProjectFiles(files: File[]): string | null {
  if (files.length > MAX_PROJECT_FILES) return `A project can have up to ${MAX_PROJECT_FILES} files.`

  for (const file of files) {
    const validationError = validateFile(file, 'project')
    if (validationError) return validationError
  }

  return null
}

function collectDeleteFileIds(formData: FormData): string[] {
  const deleteFileCount = Number(formData.get('deleteFileCount') || 0)
  const ids: string[] = []

  for (let index = 0; index < deleteFileCount; index += 1) {
    const id = (formData.get(`delete_file_id_${index}`) as string | null)?.trim()
    if (id) ids.push(id)
  }

  return ids
}

async function getProjectFileRecords(
  db: Awaited<ReturnType<typeof getDb>>,
  projectId: string,
  userId: string,
): Promise<{ id: string; file_path: string }[]> {
  const result = await db.execute({
    sql: 'SELECT id, file_path FROM project_files WHERE project_id = ? AND user_id = ?',
    args: [projectId, userId],
  })
  return result.rows as unknown as { id: string; file_path: string }[]
}

async function getOwnedProfile(db: Awaited<ReturnType<typeof getDb>>, profileId: string, userId: string): Promise<OwnedProfile | null> {
  return getOne<OwnedProfile>(db, 'SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?', [profileId, userId])
}

export async function normalizeSlugAction(value: string): Promise<string> {
  return slugify(value)
}
