import { type NextRequest, NextResponse } from 'next/server'
import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from './auth'
import { generateId, getDb, getOne } from './db'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const STATE_COOKIE = 'google_oauth_state'

interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
}

interface UserRecord {
  id: string
  email: string
}

export function createGoogleLoginResponse(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return redirectWithError(request, 'google_config')

  const state = crypto.randomUUID()
  const redirectUri = getGoogleRedirectUri(request)
  const authUrl = new URL(GOOGLE_AUTH_URL)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('prompt', 'select_account')

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })
  return response
}

export async function handleGoogleCallback(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = request.cookies.get(STATE_COOKIE)?.value

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, 'google_state')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return redirectWithError(request, 'google_config')

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: getGoogleRedirectUri(request),
      }),
    })

    const tokenData = await tokenResponse.json() as GoogleTokenResponse
    if (!tokenResponse.ok || !tokenData.access_token) {
      return redirectWithError(request, tokenData.error || 'google_token')
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileResponse.json() as GoogleUserInfo

    if (!profileResponse.ok || !profile.email || !profile.sub || profile.email_verified === false) {
      return redirectWithError(request, 'google_profile')
    }

    const user = await upsertGoogleUser(profile)
    const token = await createSession({ userId: user.id, email: user.email })
    const response = NextResponse.redirect(new URL('/dashboard', getAppUrl(request)))
    response.cookies.delete(STATE_COOKIE)
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
    return response
  } catch {
    return redirectWithError(request, 'google_failed')
  }
}

function getGoogleRedirectUri(request: NextRequest) {
  return `${getAppUrl(request)}/api/auth/google/callback`
}

function getAppUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '')
}

async function upsertGoogleUser(profile: GoogleUserInfo): Promise<UserRecord> {
  const db = await getDb()
  const email = profile.email.toLowerCase().trim()
  const existing = await getOne<UserRecord>(db, 'SELECT id, email FROM users WHERE email = ?', [email])

  if (existing) {
    await db.execute({
      sql: `
        UPDATE users
        SET auth_provider = 'google',
            provider_user_id = ?,
            display_name = ?,
            avatar_url = ?,
            email_verified = 1,
            updated_at = datetime('now')
        WHERE id = ?
      `,
      args: [profile.sub, profile.name || '', profile.picture || '', existing.id],
    })
    return existing
  }

  const id = generateId()
  await db.execute({
    sql: `
      INSERT INTO users (
        id, email, password_hash, auth_provider, provider_user_id,
        display_name, avatar_url, email_verified
      )
      VALUES (?, ?, ?, 'google', ?, ?, ?, 1)
    `,
    args: [id, email, 'oauth:google', profile.sub, profile.name || '', profile.picture || ''],
  })
  return { id, email }
}

function redirectWithError(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/login?oauth_error=${encodeURIComponent(error)}`, getAppUrl(request)))
  response.cookies.delete(STATE_COOKIE)
  return response
}
