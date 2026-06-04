import { createClient, type Client, type InArgs, type InStatement } from '@libsql/client'

let client: Client | null = null
let schemaReady: Promise<void> | null = null

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is required. Create a Turso database and set the Vercel environment variable.')
  }

  return createClient({
    url,
    authToken,
  })
}

export async function getDb(): Promise<Client> {
  if (!client) {
    client = createDbClient()
    schemaReady = initSchema(client)
  }

  await schemaReady
  return client
}

async function initSchema(db: Client) {
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;

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

  await ensureColumn(db, 'career_profiles', 'public_slug', 'TEXT')
  await ensureColumn(db, 'career_profiles', 'is_public', 'INTEGER NOT NULL DEFAULT 1')
  await ensureColumn(db, 'career_profiles', 'location', "TEXT DEFAULT ''")
  await ensureColumn(db, 'career_profiles', 'contact_email', "TEXT DEFAULT ''")
  await ensureColumn(db, 'career_profiles', 'website_url', "TEXT DEFAULT ''")
  await ensureColumn(db, 'career_profiles', 'avatar_file_path', 'TEXT')
  await ensureColumn(db, 'career_profiles', 'avatar_file_name', 'TEXT')
  await ensureColumn(db, 'career_profiles', 'avatar_uploaded_at', 'TEXT')
  await ensureColumn(db, 'career_profiles', 'show_resume_public', 'INTEGER NOT NULL DEFAULT 1')
  await backfillProfileLinks(db)
  await backfillProjectLinks(db)
  await backfillPublicSlugs(db)
  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_career_profiles_public_slug ON career_profiles(public_slug)')
}

async function ensureColumn(db: Client, table: string, column: string, definition: string) {
  const result = await db.execute(`PRAGMA table_info(${table})`)
  if (!result.rows.some(row => row.name === column)) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

async function backfillPublicSlugs(db: Client) {
  const profiles = (await db.execute(`
    SELECT id, title, public_slug
    FROM career_profiles
    WHERE public_slug IS NULL OR public_slug = ''
  `)).rows as unknown as { id: string; title: string; public_slug: string | null }[]

  for (const profile of profiles) {
    const slug = await createUniqueSlug(db, profile.title, profile.id)
    await db.execute({ sql: 'UPDATE career_profiles SET public_slug = ? WHERE id = ?', args: [slug, profile.id] })
  }
}

async function backfillProfileLinks(db: Client) {
  const profiles = (await db.execute(`
    SELECT id, user_id, website_url
    FROM career_profiles
    WHERE website_url IS NOT NULL AND website_url != ''
  `)).rows as unknown as { id: string; user_id: string; website_url: string }[]

  for (const profile of profiles) {
    const existing = await getOne(db, 'SELECT id FROM profile_links WHERE career_profile_id = ? LIMIT 1', [profile.id])
    if (existing) continue

    await db.execute({
      sql: `
        INSERT INTO profile_links (id, user_id, career_profile_id, label, url, is_public, sort_order)
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `,
      args: [generateId(), profile.user_id, profile.id, guessLinkLabel(profile.website_url), profile.website_url],
    })
  }
}

async function backfillProjectLinks(db: Client) {
  const projects = (await db.execute(`
    SELECT id, user_id, project_url
    FROM portfolio_projects
    WHERE project_url IS NOT NULL AND project_url != ''
  `)).rows as unknown as { id: string; user_id: string; project_url: string }[]

  for (const project of projects) {
    const existing = await getOne(db, 'SELECT id FROM project_links WHERE project_id = ? LIMIT 1', [project.id])
    if (existing) continue

    await db.execute({
      sql: `
        INSERT INTO project_links (id, user_id, project_id, label, url, sort_order)
        VALUES (?, ?, ?, ?, ?, 0)
      `,
      args: [generateId(), project.user_id, project.id, guessLinkLabel(project.project_url), project.project_url],
    })
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
    .replace(/[^a-z0-9а-яёіїєґ]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'profile'
}

export async function createUniqueSlug(db: Client, value: string, currentId?: string): Promise<string> {
  const base = slugify(value)
  let candidate = base
  let index = 2

  while (true) {
    const existing = await getOne<{ id: string }>(db, 'SELECT id FROM career_profiles WHERE public_slug = ?', [candidate])
    if (!existing || existing.id === currentId) return candidate
    candidate = `${base}-${index}`
    index += 1
  }
}

export async function getOne<T>(db: Client, sql: string, args: InArgs = []): Promise<T | null> {
  const result = await db.execute({ sql, args })
  return (result.rows[0] as T | undefined) ?? null
}

export async function getAll<T>(db: Client, sql: string, args: InArgs = []): Promise<T[]> {
  const result = await db.execute({ sql, args })
  return result.rows as unknown as T[]
}

export async function run(db: Client, sql: string, args: InArgs = []) {
  return db.execute({ sql, args })
}

export async function batch(db: Client, statements: InStatement[]) {
  return db.batch(statements, 'write')
}
