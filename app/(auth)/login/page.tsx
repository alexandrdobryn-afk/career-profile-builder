import { AuthForm } from '@/components/AuthForm'
import { loginAction } from '@/lib/actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ oauth_error?: string }>
}) {
  const params = await searchParams
  return <AuthForm mode="login" action={loginAction} oauthError={params?.oauth_error} />
}
