'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { defaultLang, dict, Lang, normalizeLang } from '@/lib/i18n'

type Copy = (typeof dict)[Lang]

const LanguageContext = createContext<{
  lang: Lang
  setLang: (lang: Lang) => void
  copy: Copy
}>({
  lang: defaultLang,
  setLang: () => {},
  copy: dict[defaultLang],
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof document === 'undefined') return defaultLang
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    if (urlLang) return normalizeLang(urlLang)
    const cookieLang = document.cookie
      .split('; ')
      .find(row => row.startsWith('lang='))
      ?.split('=')[1]
    return normalizeLang(cookieLang)
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`
  }, [lang])

  const setLang = (next: Lang) => {
    setLangState(next)
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`
    window.location.reload()
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, copy: dict[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
