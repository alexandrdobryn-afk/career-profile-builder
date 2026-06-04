import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const SESSION_COOKIE_NAME = 'session'

export interface SessionPayload {
  userId: string
  email: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32 || secret.startsWith('change-me'))) {
    throw new Error('JWT_SECRET must be set to a random 32+ character value in production')
  }

  return new TextEncoder().encode(secret || 'dev-secret-change-in-production-please-32ch')
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export const getCurrentUser = cache(async (): Promise<SessionPayload | null> => {
  return getSession()
})

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}
