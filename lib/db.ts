import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'app.db')
const dataDir = path.dirname(DB_PATH)

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS career_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      public_slug TEXT UNIQUE,
      is_public INTEGER NOT NULL DEFAULT 1,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      role TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      skills TEXT DEFAULT '',
      location TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      website_url TEXT DEFAULT '',
      avatar_file_path TEXT,
      avatar_file_name TEXT,
      avatar_uploaded_at TEXT,
      show_resume_public INTEGER NOT NULL DEFAULT 1,
      resume_file_path TEXT,
      resume_file_name TEXT,
      resume_uploaded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_profile_id TEXT NOT NULL,
      title TEXT NOT NULL,
      role TEXT DEFAULT '',
      description TEXT DEFAULT '',
      skills TEXT DEFAULT '',
      project_url TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (career_profile_id) REFERENCES career_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_profile_id TEXT NOT NULL,
      title TEXT NOT NULL,
      issuer TEXT DEFAULT '',
      issued_at TEXT DEFAULT '',
      credential_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      file_path TEXT,
      file_name TEXT,
      file_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (career_profile_id) REFERENCES career_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile_links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      career_profile_id TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (career_profile_id) REFERENCES career_profiles(id) ON DELETE CASCADE
    );
  `)

  ensureColumn(db, 'career_profiles', 'public_slug', 'TEXT')
  ensureColumn(db, 'career_profiles', 'is_public', 'INTEGER NOT NULL DEFAULT 1')
  ensureColumn(db, 'career_profiles', 'location', "TEXT DEFAULT ''")
  ensureColumn(db, 'career_profiles', 'contact_email', "TEXT DEFAULT ''")
  ensureColumn(db, 'career_profiles', 'website_url', "TEXT DEFAULT ''")
  ensureColumn(db, 'career_profiles', 'avatar_file_path', 'TEXT')
  ensureColumn(db, 'career_profiles', 'avatar_file_name', 'TEXT')
  ensureColumn(db, 'career_profiles', 'avatar_uploaded_at', 'TEXT')
  ensureColumn(db, 'career_profiles', 'show_resume_public', 'INTEGER NOT NULL DEFAULT 1')
  backfillProfileLinks(db)
  backfillProjectLinks(db)
  backfillPublicSlugs(db)
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_career_profiles_public_slug ON career_profiles(public_slug)')
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!columns.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

function backfillPublicSlugs(db: Database.Database) {
  const profiles = db.prepare(`
    SELECT id, title, public_slug
    FROM career_profiles
    WHERE public_slug IS NULL OR public_slug = ''
  `).all() as { id: string; title: string; public_slug: string | null }[]

  for (const profile of profiles) {
    const slug = createUniqueSlug(db, profile.title, profile.id)
    db.prepare('UPDATE career_profiles SET public_slug = ? WHERE id = ?').run(slug, profile.id)
  }
}

function backfillProfileLinks(db: Database.Database) {
  const profiles = db.prepare(`
    SELECT id, user_id, website_url
    FROM career_profiles
    WHERE website_url IS NOT NULL AND website_url != ''
  `).all() as { id: string; user_id: string; website_url: string }[]

  for (const profile of profiles) {
    const existing = db.prepare('SELECT id FROM profile_links WHERE career_profile_id = ? LIMIT 1').get(profile.id)
    if (existing) continue

    db.prepare(`
      INSERT INTO profile_links (id, user_id, career_profile_id, label, url, is_public, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `).run(generateId(), profile.user_id, profile.id, guessLinkLabel(profile.website_url), profile.website_url)
  }
}

function backfillProjectLinks(db: Database.Database) {
  const projects = db.prepare(`
    SELECT id, user_id, project_url
    FROM portfolio_projects
    WHERE project_url IS NOT NULL AND project_url != ''
  `).all() as { id: string; user_id: string; project_url: string }[]

  for (const project of projects) {
    const existing = db.prepare('SELECT id FROM project_links WHERE project_id = ? LIMIT 1').get(project.id)
    if (existing) continue

    db.prepare(`
      INSERT INTO project_links (id, user_id, project_id, label, url, sort_order)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(generateId(), project.user_id, project.id, guessLinkLabel(project.project_url), project.project_url)
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

export function generateId(): string {
  return crypto.randomUUID()
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яёієїґ]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'profile'
}

export function createUniqueSlug(db: Database.Database, value: string, currentId?: string): string {
  const base = slugify(value)
  let candidate = base
  let index = 2

  while (true) {
    const existing = db.prepare('SELECT id FROM career_profiles WHERE public_slug = ?').get(candidate) as { id: string } | undefined
    if (!existing || existing.id === currentId) return candidate
    candidate = `${base}-${index}`
    index += 1
  }
}
