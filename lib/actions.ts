'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie, clearSessionCookie, getCurrentUser } from './auth'
import { createUniqueSlug, generateId, getDb, slugify } from './db'
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

export async function registerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!email || !password) return { error: 'Заполните все поля' }
  if (password.length < 8) return { error: 'Пароль должен быть не короче 8 символов' }
  if (password !== confirm) return { error: 'Пароли не совпадают' }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return { error: 'Пользователь с таким email уже существует' }

  const hash = await bcrypt.hash(password, 12)
  const id = generateId()
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, hash)

  const token = await createSession({ userId: id, email })
  await setSessionCookie(token)
  redirect('/dashboard')
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Заполните все поля' }

  const db = getDb()
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as
    | { id: string; email: string; password_hash: string }
    | undefined

  if (!user) return { error: 'Неверный email или пароль' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Неверный email или пароль' }

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
  if (!title) return { error: 'Введите название профиля' }

  const db = getDb()
  const id = generateId()
  const requestedSlug = (formData.get('public_slug') as string)?.trim() || title
  const publicSlug = createUniqueSlug(db, requestedSlug, id)

  db.prepare(`
    INSERT INTO career_profiles (
      id, user_id, title, public_slug, is_public,
      first_name, last_name, role, bio, skills, location, contact_email, website_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  )

  revalidatePath('/')
  revalidatePath('/dashboard')
  redirect(`/dashboard/profile/${id}`)
}

export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const profileId = formData.get('profileId') as string
  const db = getDb()

  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Введите название профиля' }

  const requestedSlug = (formData.get('public_slug') as string)?.trim() || title
  const publicSlug = createUniqueSlug(db, requestedSlug, profileId)

  db.prepare(`
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
  `).run(
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
  )

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

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  db.prepare('DELETE FROM career_profiles WHERE id = ? AND user_id = ?').run(profileId, session.userId)
  deleteDirectory(getProfilePath(session.userId, profileId))

  revalidatePath('/')
  revalidatePath(`/p/${profile.public_slug}`)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function uploadResumeAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Не авторизован' }

  const profileId = formData.get('profileId') as string
  const file = formData.get('file') as File

  if (!file || file.size === 0) return { error: 'Выберите файл' }

  const validationError = validateFile(file, 'resume')
  if (validationError) return { error: validationError }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  const dirPath = getResumePath(session.userId, profileId)
  clearDirectory(dirPath)

  const filePath = await saveFile(file, dirPath, 'resume')

  db.prepare(`
    UPDATE career_profiles
    SET resume_file_path=?, resume_file_name=?, resume_uploaded_at=datetime('now'), show_resume_public=1, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `).run(filePath, file.name, profileId, session.userId)

  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function deleteResumeAction(profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Не авторизован' }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  deleteDirectory(getResumePath(session.userId, profileId))
  db.prepare(`
    UPDATE career_profiles
    SET resume_file_path=NULL, resume_file_name=NULL, resume_uploaded_at=NULL, show_resume_public=0, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `).run(profileId, session.userId)

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function setResumePublicAction(profileId: string, visible: boolean): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Не авторизован' }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  db.prepare(`
    UPDATE career_profiles
    SET show_resume_public=?, updated_at=datetime('now')
    WHERE id=? AND user_id=? AND resume_file_path IS NOT NULL
  `).run(visible ? 1 : 0, profileId, session.userId)

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Не авторизован' }

  const profileId = formData.get('profileId') as string
  const file = formData.get('file') as File

  if (!file || file.size === 0) return { error: 'Выберите фото' }

  const validationError = validateFile(file, 'avatar')
  if (validationError) return { error: validationError }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  const dirPath = getAvatarPath(session.userId, profileId)
  clearDirectory(dirPath)
  const filePath = await saveFile(file, dirPath, 'avatar')

  db.prepare(`
    UPDATE career_profiles
    SET avatar_file_path=?, avatar_file_name=?, avatar_uploaded_at=datetime('now'), updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `).run(filePath, file.name, profileId, session.userId)

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function deleteAvatarAction(profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { error: 'Не авторизован' }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  deleteDirectory(getAvatarPath(session.userId, profileId))
  db.prepare(`
    UPDATE career_profiles
    SET avatar_file_path=NULL, avatar_file_name=NULL, avatar_uploaded_at=NULL, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `).run(profileId, session.userId)

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
  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  const links: { label: string; url: string; isPublic: number; sortOrder: number }[] = []
  for (let index = 0; index < linkCount; index += 1) {
    const rawUrl = (formData.get(`url_${index}`) as string | null)?.trim()
    if (!rawUrl) continue

    const url = normalizeUrl(rawUrl)
    if (!url) return { error: 'Проверьте ссылки: разрешены только http и https адреса' }

    const rawLabel = (formData.get(`label_${index}`) as string | null)?.trim()
    links.push({
      label: rawLabel || guessLinkLabel(url),
      url,
      isPublic: formData.get(`public_${index}`) === 'on' ? 1 : 0,
      sortOrder: links.length,
    })
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM profile_links WHERE career_profile_id = ? AND user_id = ?').run(profileId, session.userId)
    const insert = db.prepare(`
      INSERT INTO profile_links (id, user_id, career_profile_id, label, url, is_public, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    for (const link of links) {
      insert.run(generateId(), session.userId, profileId, link.label, link.url, link.isPublic, link.sortOrder)
    }
  })
  transaction()

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
  if (!title) return { error: 'Введите название проекта' }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

  const file = formData.get('file') as File
  if (file && file.size > 0) {
    const validationError = validateFile(file, 'project')
    if (validationError) return { error: validationError }
  }

  const id = generateId()
  const links = collectProjectLinks(formData)
  if (links.error) return { error: links.error }

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO portfolio_projects (id, user_id, career_profile_id, title, role, description, skills, project_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, '')
    `).run(
      id,
      session.userId,
      profileId,
      title,
      (formData.get('role') as string) || '',
      (formData.get('description') as string) || '',
      (formData.get('skills') as string) || '',
    )

    insertProjectLinks(db, session.userId, id, links.items)
  })
  transaction()

  if (file && file.size > 0) {
    const dirPath = getProjectPath(session.userId, profileId, id)
    const filePath = await saveFile(file, dirPath, 'content')
    db.prepare(`
      INSERT INTO project_files (id, user_id, project_id, file_path, file_name, file_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generateId(), session.userId, id, filePath, file.name, file.type)
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
  if (!title) return { error: 'Введите название проекта' }

  const db = getDb()
  const project = db.prepare(`
    SELECT pp.id, cp.public_slug
    FROM portfolio_projects pp
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pp.id = ? AND pp.user_id = ?
  `).get(projectId, session.userId) as { id: string; public_slug: string } | undefined
  if (!project) return { error: 'Проект не найден' }

  const file = formData.get('file') as File
  if (file && file.size > 0) {
    const validationError = validateFile(file, 'project')
    if (validationError) return { error: validationError }
  }

  const links = collectProjectLinks(formData)
  if (links.error) return { error: links.error }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE portfolio_projects
      SET title=?, role=?, description=?, skills=?, project_url='', updated_at=datetime('now')
      WHERE id=? AND user_id=?
    `).run(
      title,
      (formData.get('role') as string) || '',
      (formData.get('description') as string) || '',
      (formData.get('skills') as string) || '',
      projectId,
      session.userId,
    )

    db.prepare('DELETE FROM project_links WHERE project_id = ? AND user_id = ?').run(projectId, session.userId)
    insertProjectLinks(db, session.userId, projectId, links.items)
  })
  transaction()

  if (file && file.size > 0) {
    const dirPath = getProjectPath(session.userId, profileId, projectId)
    deleteDirectory(dirPath)
    const filePath = await saveFile(file, dirPath, 'content')
    db.prepare('DELETE FROM project_files WHERE project_id = ?').run(projectId)
    db.prepare(`
      INSERT INTO project_files (id, user_id, project_id, file_path, file_name, file_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generateId(), session.userId, projectId, filePath, file.name, file.type)
  }

  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${project.public_slug}`)
  redirect(`/dashboard/profile/${profileId}`)
}

export async function deleteProjectAction(projectId: string, profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const db = getDb()
  const project = db.prepare(`
    SELECT pp.id, cp.public_slug
    FROM portfolio_projects pp
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pp.id = ? AND pp.user_id = ?
  `).get(projectId, session.userId) as { id: string; public_slug: string } | undefined
  if (!project) return { error: 'Проект не найден' }

  db.prepare('DELETE FROM portfolio_projects WHERE id = ? AND user_id = ?').run(projectId, session.userId)
  deleteDirectory(getProjectPath(session.userId, profileId, projectId))

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
  if (!title) return { error: 'Введите название сертификата' }

  const db = getDb()
  const profile = db.prepare('SELECT id, public_slug FROM career_profiles WHERE id = ? AND user_id = ?').get(profileId, session.userId) as
    | { id: string; public_slug: string }
    | undefined
  if (!profile) return { error: 'Профиль не найден' }

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

  db.prepare(`
    INSERT INTO certificates (
      id, user_id, career_profile_id, title, issuer, issued_at,
      credential_url, description, file_path, file_name, file_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  )

  revalidatePath('/')
  revalidatePath(`/dashboard/profile/${profileId}`)
  revalidatePath(`/p/${profile.public_slug}`)
  return { success: true }
}

export async function deleteCertificateAction(certificateId: string, profileId: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const db = getDb()
  const certificate = db.prepare(`
    SELECT c.id, cp.public_slug
    FROM certificates c
    JOIN career_profiles cp ON cp.id = c.career_profile_id
    WHERE c.id = ? AND c.user_id = ?
  `).get(certificateId, session.userId) as { id: string; public_slug: string } | undefined
  if (!certificate) return { error: 'Сертификат не найден' }

  db.prepare('DELETE FROM certificates WHERE id = ? AND user_id = ?').run(certificateId, session.userId)
  deleteDirectory(getCertificatePath(session.userId, profileId, certificateId))

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
      return { items: [], error: 'Проверьте ссылки проекта: разрешены только http и https адреса' }
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

function insertProjectLinks(
  db: ReturnType<typeof getDb>,
  userId: string,
  projectId: string,
  links: { label: string; url: string; sortOrder: number }[],
) {
  const insert = db.prepare(`
    INSERT INTO project_links (id, user_id, project_id, label, url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  for (const link of links) {
    insert.run(generateId(), userId, projectId, link.label, link.url, link.sortOrder)
  }
}

export async function normalizeSlugAction(value: string): Promise<string> {
  return slugify(value)
}
