import Link from 'next/link'
import { ProfileForm } from '@/components/ProfileForm'
import { t } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n-server'

export default async function NewProfilePage() {
  const lang = await getRequestLang()
  const copy = t(lang)

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          {copy.dashboard.backToProfiles}
        </Link>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-.3px' }}>
        {copy.dashboard.newProfile}
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        {copy.dashboard.newProfileText}
      </p>
      <ProfileForm />
    </>
  )
}
