import path from 'path'
import { del, list, put } from '@vercel/blob'

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
  const maxLabel = category === 'avatar' ? '2 MB' : '10 MB'
  if (file.size > maxSize) return `File is too large. Maximum ${maxLabel}.`

  const ext = path.extname(file.name).toLowerCase()
  const allowedExts = getAllowedExts(category)
  const allowedTypes = getAllowedTypes(category)

  if (!allowedExts.includes(ext)) {
    return `Unsupported file format. Allowed: ${allowedExts.join(', ')}`
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    return 'Unsupported file type'
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

function joinStoragePath(...parts: string[]): string {
  return parts
    .flatMap(part => part.split(/[\\/]+/))
    .map(part => part.trim())
    .filter(Boolean)
    .join('/')
}

export function getProfilePath(userId: string, profileId: string): string {
  return joinStoragePath('users', userId, 'profiles', profileId)
}

export function getResumePath(userId: string, profileId: string): string {
  return joinStoragePath(getProfilePath(userId, profileId), 'resume')
}

export function getAvatarPath(userId: string, profileId: string): string {
  return joinStoragePath(getProfilePath(userId, profileId), 'avatar')
}

export function getProjectPath(userId: string, profileId: string, projectId: string): string {
  return joinStoragePath(getProfilePath(userId, profileId), 'projects', projectId)
}

export function getCertificatePath(userId: string, profileId: string, certificateId: string): string {
  return joinStoragePath(getProfilePath(userId, profileId), 'certificates', certificateId)
}

export async function saveFile(file: File, dirPath: string, filename: string): Promise<string> {
  const ext = path.extname(file.name).toLowerCase()
  const pathname = joinStoragePath(dirPath, filename + ext)

  const blob = await put(pathname, file, {
    access: 'private',
    allowOverwrite: true,
    contentType: file.type || undefined,
  })

  return blob.pathname
}

export async function deleteDirectory(dirPath: string) {
  const prefix = joinStoragePath(dirPath)
  const blobs = await list({ prefix, limit: 1000 })
  if (blobs.blobs.length > 0) {
    await del(blobs.blobs.map(blob => blob.pathname))
  }
}

export async function clearDirectory(dirPath: string) {
  await deleteDirectory(dirPath)
}

export function getPublicFilePath(pathname: string): string {
  return `/api/files/${pathname.replace(/^\/+/, '')}`
}
