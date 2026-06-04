'use client'

import { useActionState, useRef, useState } from 'react'
import { createCertificateAction } from '@/lib/actions'

type ActionResult = { error?: string; success?: boolean } | undefined

export function CertificateForm({ profileId }: { profileId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createCertificateAction, undefined)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <form action={formAction} encType="multipart/form-data" style={{
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 16,
      marginTop: 12,
    }}>
      <input type="hidden" name="profileId" value={profileId} />

      {state?.error && (
        <div style={{
          background: 'var(--danger-bg)', color: 'var(--danger-text)',
          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          fontSize: 12, marginBottom: 12,
        }}>{state.error}</div>
      )}

      {state?.success && (
        <div style={{
          background: 'var(--success-bg)', color: 'var(--success-text)',
          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          fontSize: 12, marginBottom: 12,
        }}>Сертификат добавлен</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Название *</label>
          <input name="title" required placeholder="AI Automation Certificate" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Кто выдал</label>
          <input name="issuer" placeholder="Coursera, Google, Mate Academy" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Дата</label>
          <input type="month" name="issued_at" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Ссылка</label>
          <input type="url" name="credential_url" placeholder="https://..." />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Описание</label>
        <textarea name="description" placeholder="Что подтверждает сертификат." />
      </div>

      <input
        ref={fileRef}
        type="file"
        name="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        style={{ display: 'none' }}
        onChange={event => setFilePreview(event.target.files?.[0]?.name || null)}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            background: 'transparent', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 14px',
            fontSize: 13, color: 'var(--text2)', cursor: 'pointer',
          }}
        >
          {filePreview || 'Прикрепить файл'}
        </button>
        <button type="submit" disabled={pending} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-sm)', padding: '8px 18px',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          {pending ? 'Добавление...' : 'Добавить сертификат'}
        </button>
      </div>
    </form>
  )
}
