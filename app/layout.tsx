import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'JobProfile - профили специалистов',
  description: 'Публичные профили специалистов с резюме, портфолио, сертификатами и профессиональными ссылками.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
