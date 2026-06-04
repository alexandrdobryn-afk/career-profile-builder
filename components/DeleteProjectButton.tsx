'use client'

import { useTransition } from 'react'
import { deleteProjectAction } from '@/lib/actions'
import { useLanguage } from './LanguageProvider'

export function DeleteProjectButton({ projectId, profileId }: { projectId: string; profileId: string }) {
  const { copy } = useLanguage()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm(copy.dashboard.deleteProjectConfirm)) return
        startTransition(async () => {
          await deleteProjectAction(projectId, profileId)
          window.location.reload()
        })
      }}
      disabled={pending}
      style={{
        background: 'transparent',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '5px 10px',
        fontSize: 12,
        cursor: 'pointer',
        color: 'var(--danger-text)',
      }}
    >
      {pending ? '...' : copy.dashboard.delete}
    </button>
  )
}
