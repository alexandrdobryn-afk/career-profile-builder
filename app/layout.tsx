import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getRequestLang } from '@/lib/i18n-server'

export const metadata: Metadata = {
  title: 'JobProfile - профили специалистов',
  description: 'Публичные профили специалистов с резюме, портфолио, сертификатами и профессиональными ссылками.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getRequestLang()

  return (
    <html lang={lang === 'uk' ? 'uk-UA' : lang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider initialLang={lang}>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
