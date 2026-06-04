'use client'

import { useTransition } from 'react'
import { deleteCertificateAction } from '@/lib/actions'
import { useLanguage } from './LanguageProvider'

export function DeleteCertificateButton({ certificateId, profileId }: { certificateId: string; profileId: string }) {
  const { copy } = useLanguage()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(copy.dashboard.certificate.deleteConfirm)) return
        startTransition(() => {
          deleteCertificateAction(certificateId, profileId)
        })
      }}
      style={{
        background: 'transparent',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '5px 10px',
        fontSize: 12,
        color: 'var(--danger-text)',
        cursor: 'pointer',
      }}
    >
      {pending ? copy.dashboard.certificate.deleting : copy.dashboard.delete}
    </button>
  )
}
