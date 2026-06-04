'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useLanguage } from './LanguageProvider'

type ActionResult = { error?: string; success?: boolean } | undefined
type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>

interface AuthFormProps {
  mode: 'login' | 'register'
  action: Action
  oauthError?: string
}

export function AuthForm({ mode, action, oauthError }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined)
  const { copy } = useLanguage()
  const visibleError = state?.error || (oauthError ? copy.auth.oauthError : '')

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '32px',
      width: '100%',
      maxWidth: '380px',
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        {mode === 'login' ? copy.auth.loginTitle : copy.auth.registerTitle}
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
        {mode === 'login' ? copy.auth.loginSubtitle : copy.auth.registerSubtitle}
      </p>

      {visibleError && (
        <div style={{
          background: 'var(--danger-bg)',
          color: 'var(--danger-text)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          marginBottom: 16,
        }}>{visibleError}</div>
      )}

      <form action={formAction}>
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input type="email" name="email" placeholder="you@example.com" required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>{copy.auth.password}</label>
          <input type="password" name="password" placeholder={copy.auth.passwordPlaceholder} required minLength={8} />
        </div>
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label>{copy.auth.confirmPassword}</label>
            <input type="password" name="confirm" placeholder={copy.auth.confirmPlaceholder} required />
          </div>
        )}
        <button type="submit" disabled={pending} style={{
          width: '100%',
          background: 'var(--accent)',
          border: '0.5px solid var(--accent)',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 4,
        }}>
          {pending ? copy.auth.loading : mode === 'login' ? copy.auth.login : copy.auth.register}
        </button>
      </form>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 10,
        alignItems: 'center',
        margin: '20px 0',
        color: 'var(--text3)',
        fontSize: 12,
      }}>
        <span style={{ height: 1, background: 'var(--border)' }} />
        <span>{copy.auth.or}</span>
        <span style={{ height: 1, background: 'var(--border)' }} />
      </div>

      <Link href="/api/auth/google" className="google-auth-button" style={{
        width: '100%',
        minHeight: 44,
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface2)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 700,
        textDecoration: 'none',
      }}>
        <span aria-hidden="true" style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4285f4',
          fontWeight: 900,
          fontSize: 15,
          fontFamily: 'Arial, sans-serif',
        }}>G</span>
        {mode === 'login' ? copy.auth.loginWithGoogle : copy.auth.registerWithGoogle}
      </Link>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
        {mode === 'login' ? (
          <>{copy.auth.noAccount} <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{copy.auth.register}</Link></>
        ) : (
          <>{copy.auth.hasAccount} <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{copy.auth.login}</Link></>
        )}
      </div>
    </div>
  )
}
