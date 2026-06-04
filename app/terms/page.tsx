import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { getRequestLang } from '@/lib/i18n-server'
import { legalDocuments } from '@/lib/legal'

interface Props {
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { lang: langParam } = await searchParams
  const lang = await getRequestLang(langParam)
  const document = legalDocuments[lang].terms

  return {
    title: `${document.title} - JobProfile`,
    description: document.description,
  }
}

export default async function TermsPage({ searchParams }: Props) {
  const { lang: langParam } = await searchParams
  const lang = await getRequestLang(langParam)
  const document = legalDocuments[lang].terms

  return (
    <LegalPage lang={lang} title={document.title} updatedAt={document.updatedAt}>
      {document.intro.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {document.sections.map(section => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.body.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </LegalPage>
  )
}
