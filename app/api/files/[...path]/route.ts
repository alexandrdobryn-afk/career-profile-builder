import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')
const UPLOADS_ROOT_ABSOLUTE = path.resolve(UPLOADS_ROOT)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const relativePath = pathSegments.join('/')
  const absolutePath = path.resolve(UPLOADS_ROOT_ABSOLUTE, relativePath)

  if (!isInsideDirectory(absolutePath, UPLOADS_ROOT_ABSOLUTE)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const session = await getCurrentUser()
  if (!session && !isPublicFile(absolutePath)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (session) {
    const expectedPrefix = path.resolve(UPLOADS_ROOT_ABSOLUTE, 'users', session.userId)
    if (!isInsideDirectory(absolutePath, expectedPrefix) && !isPublicFile(absolutePath)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const ext = path.extname(absolutePath).toLowerCase()
  const contentType = getContentType(ext)
  const fileBuffer = fs.readFileSync(absolutePath)
  const fileName = path.basename(absolutePath)
  const isHtml = ext === '.html' || ext === '.htm'

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${isHtml ? 'attachment' : 'inline'}; filename="${fileName}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}

function isInsideDirectory(filePath: string, directoryPath: string): boolean {
  const relative = path.relative(directoryPath, filePath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function isPublicFile(filePath: string): boolean {
  const db = getDb()

  const resume = db.prepare(`
    SELECT cp.id
    FROM career_profiles cp
    WHERE cp.resume_file_path = ? AND cp.is_public = 1 AND cp.show_resume_public = 1
  `).get(filePath)
  if (resume) return true

  const avatar = db.prepare(`
    SELECT cp.id
    FROM career_profiles cp
    WHERE cp.avatar_file_path = ? AND cp.is_public = 1
  `).get(filePath)
  if (avatar) return true

  const projectFile = db.prepare(`
    SELECT pf.id
    FROM project_files pf
    JOIN portfolio_projects pp ON pp.id = pf.project_id
    JOIN career_profiles cp ON cp.id = pp.career_profile_id
    WHERE pf.file_path = ? AND cp.is_public = 1
  `).get(filePath)
  if (projectFile) return true

  const certificateFile = db.prepare(`
    SELECT c.id
    FROM certificates c
    JOIN career_profiles cp ON cp.id = c.career_profile_id
    WHERE c.file_path = ? AND cp.is_public = 1
  `).get(filePath)

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
    '.webp': 'image/webp',
  }

  return map[ext] || 'application/octet-stream'
}
