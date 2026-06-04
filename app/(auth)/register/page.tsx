import { AuthForm } from '@/components/AuthForm'
import { registerAction } from '@/lib/actions'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ oauth_error?: string }>
}) {
  const params = await searchParams
  return <AuthForm mode="register" action={registerAction} oauthError={params?.oauth_error} />
}
