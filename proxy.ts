import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from './lib/auth'
import { defaultLang, detectLangFromAcceptLanguage, detectLangFromCountry, isSupportedLang, normalizeLang } from './lib/i18n'

const AUTH_ROUTES = ['/login', '/register']
const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API and static routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const requestLang = getPreferredLang(request)

  const token = request.cookies.get('session')?.value
  const session = token ? await verifySession(token) : null

  // Redirect logged-in users away from auth pages
  if (session && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    return withLangCookie(NextResponse.redirect(new URL('/dashboard', request.url)), requestLang)
  }

  // Protect dashboard routes
  if (!session && pathname.startsWith('/dashboard')) {
    return withLangCookie(NextResponse.redirect(new URL('/login', request.url)), requestLang)
  }

  return withLangCookie(NextResponse.next(), requestLang)
}

function getPreferredLang(request: NextRequest) {
  const queryLang = request.nextUrl.searchParams.get('lang')
  if (isSupportedLang(queryLang) || queryLang === 'ua') return normalizeLang(queryLang)

  const cookieLang = request.cookies.get('lang')?.value
  if (isSupportedLang(cookieLang) || cookieLang === 'ua') return normalizeLang(cookieLang)

  return (
    detectLangFromCountry(request.headers.get('x-vercel-ip-country')) ||
    detectLangFromAcceptLanguage(request.headers.get('accept-language')) ||
    defaultLang
  )
}

function withLangCookie(response: NextResponse, lang: string) {
  response.cookies.set('lang', lang, {
    path: '/',
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
