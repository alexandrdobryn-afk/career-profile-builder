import path from 'path'
import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDb, getOne } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params
  const pathname = normalizeBlobPath(pathSegments)
  if (!pathname) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const session = await getCurrentUser()
  const isPublic = await isPublicFile(pathname)
  if (!session && !isPublic) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (session) {
    const ownsFile = pathname.startsWith(`users/${session.userId}/`)
    if (!ownsFile && !isPublic) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const blob = await get(pathname, { access: 'private' })
  if (!blob?.stream) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ext = path.extname(pathname).toLowerCase()
  const contentType = getContentType(ext)
  const fileName = path.basename(pathname)
  const isHtml = ext === '.html' || ext === '.htm'

  return new NextResponse(blob.stream as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${isHtml ? 'attachment' : 'inline'}; filename="${fileName}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}

function normalizeBlobPath(pathSegments: string[]): string | null {
  const pathname = pathSegments.join('/').replace(/\\/g, '/')
  const normalized = path.posix.normalize(pathname)
  if (normalized.startsWith('../') || normalized === '..' || path.posix.isAbsolute(normalized)) {
    return null
  }
  return normalized
}

async function isPublicFile(pathname: string): Promise<boolean> {
  const db = await getDb()

  const resume = await getOne(db, `
    SELECT cp.id
    FROM career_profiles cp
    WHERE cp.resume_file_path = ? AND cp.is_public = 1 AND cp.show_resume_public = 1
  `, [pathname])
  if (resume) return true

  const avatar = await getOne(db, `
    SELECT cp.id
    FROM career_profiles cp
    WHERE cp.avatar_file_path = ? AND cp.is_public = 1
  `, [pathname])
  if (avatar) return true

  const projectFile = await getOne(db, `
    SELECT pf.id
    FROM project_files pf
    JOIN portfolio_projects pp ON pp.id = pf.project_id
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pf.file_path = ? AND cp.is_public = 1
  `, [pathname])
  if (projectFile) return true

  const certificateFile = await getOne(db, `
    SELECT c.id
    FROM certificates c
    JOIN career_profiles cp ON cp.id = c.career_profile_id
    WHERE c.file_path = ? AND cp.is_public = 1
  `, [pathname])

  return Boolean(certificateFile)
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }

  return map[ext] || 'application/octet-stream'
}
