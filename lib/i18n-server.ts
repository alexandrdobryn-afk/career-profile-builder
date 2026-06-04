import { cookies, headers } from 'next/headers'
import { defaultLang, detectLangFromAcceptLanguage, detectLangFromCountry, Lang, normalizeLang } from './i18n'

export async function getRequestLang(value?: string | null): Promise<Lang> {
  if (value) return normalizeLang(value)
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get('lang')?.value
  if (cookieLang) return normalizeLang(cookieLang)

  const headerStore = await headers()
  return (
    detectLangFromCountry(headerStore.get('x-vercel-ip-country')) ||
    detectLangFromAcceptLanguage(headerStore.get('accept-language')) ||
    defaultLang
  )
}
