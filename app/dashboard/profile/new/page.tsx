import Link from 'next/link'
import { ProfileForm } from '@/components/ProfileForm'

export default function NewProfilePage() {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          Назад к профилям
        </Link>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-.3px' }}>
        Новый профиль
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        Создайте публичную страницу специалиста. Резюме, проекты и сертификаты можно добавить после создания.
      </p>
      <ProfileForm />
    </>
  )
}
