import { cookies } from 'next/headers'
import { Lang, normalizeLang } from './i18n'

export async function getRequestLang(value?: string | null): Promise<Lang> {
  if (value) return normalizeLang(value)
  const cookieStore = await cookies()
  return normalizeLang(cookieStore.get('lang')?.value)
}
