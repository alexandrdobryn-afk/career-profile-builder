import { AuthForm } from '@/components/AuthForm'
import { registerAction } from '@/lib/actions'

export default function RegisterPage() {
  return <AuthForm mode="register" action={registerAction} />
}
