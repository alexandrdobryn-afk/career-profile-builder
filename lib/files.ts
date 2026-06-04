import fs from 'fs'
import path from 'path'

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const ALLOWED_RESUME_EXTS = ['.pdf', '.html', '.htm', '.docx', '.txt']
const ALLOWED_AVATAR_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
const ALLOWED_PROJECT_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf']
const ALLOWED_CERTIFICATE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf']

const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'text/html',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const ALLOWED_PROJECT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const ALLOWED_CERTIFICATE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export type FileCategory = 'resume' | 'avatar' | 'project' | 'certificate'

export function validateFile(file: File, category: FileCategory): string | null {
  const maxSize = category === 'avatar' ? MAX_AVATAR_SIZE : MAX_FILE_SIZE
  const maxLabel = category === 'avatar' ? '2 МБ' : '10 МБ'
  if (file.size > maxSize) return `Файл слишком большой. Максимум ${maxLabel}.`

  const ext = path.extname(file.name).toLowerCase()
  const allowedExts = getAllowedExts(category)
  const allowedTypes = getAllowedTypes(category)

  if (!allowedExts.includes(ext)) {
    return `Недопустимый формат файла. Разрешены: ${allowedExts.join(', ')}`
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    return 'Недопустимый тип файла'
  }

  return null
}

function getAllowedExts(category: FileCategory) {
  if (category === 'resume') return ALLOWED_RESUME_EXTS
  if (category === 'avatar') return ALLOWED_AVATAR_EXTS
  if (category === 'certificate') return ALLOWED_CERTIFICATE_EXTS
  return ALLOWED_PROJECT_EXTS
}

function getAllowedTypes(category: FileCategory) {
  if (category === 'resume') return ALLOWED_RESUME_TYPES
  if (category === 'avatar') return ALLOWED_AVATAR_TYPES
  if (category === 'certificate') return ALLOWED_CERTIFICATE_TYPES
  return ALLOWED_PROJECT_TYPES
}

export function getProfilePath(userId: string, profileId: string): string {
  return path.join(UPLOADS_ROOT, 'users', userId, 'profiles', profileId)
}

export function getResumePath(userId: string, profileId: string): string {
  return path.join(getProfilePath(userId, profileId), 'resume')
}

export function getAvatarPath(userId: string, profileId: string): string {
  return path.join(getProfilePath(userId, profileId), 'avatar')
}

export function getProjectPath(userId: string, profileId: string, projectId: string): string {
  return path.join(getProfilePath(userId, profileId), 'projects', projectId)
}

export function getCertificatePath(userId: string, profileId: string, certificateId: string): string {
  return path.join(getProfilePath(userId, profileId), 'certificates', certificateId)
}

export async function saveFile(file: File, dirPath: string, filename: string): Promise<string> {
  fs.mkdirSync(dirPath, { recursive: true })

  const ext = path.extname(file.name).toLowerCase()
  const fullPath = path.join(dirPath, filename + ext)
  const bytes = await file.arrayBuffer()

  fs.writeFileSync(fullPath, Buffer.from(bytes))
  return fullPath
}

export function deleteDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

export function clearDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => fs.unlinkSync(path.join(dirPath, file)))
  }
}

export function getPublicFilePath(absolutePath: string): string {
  const relative = path.relative(UPLOADS_ROOT, absolutePath)
  return `/api/files/${relative.replace(/\\/g, '/')}`
}
