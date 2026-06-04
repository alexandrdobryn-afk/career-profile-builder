'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { deleteAvatarAction, uploadAvatarAction } from '@/lib/actions'
import { useLanguage } from './LanguageProvider'

interface AvatarUploadProps {
  profileId: string
  currentAvatar?: { url: string; name: string } | null
}

export function AvatarUpload({ profileId, currentAvatar }: AvatarUploadProps) {
  const { copy } = useLanguage()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadSelected = (file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.set('profileId', profileId)
    formData.set('file', file)

    setError(null)
    startTransition(async () => {
      const result = await uploadAvatarAction(formData)
      if (result?.error) setError(result.error)
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  const handleDelete = () => {
    if (!window.confirm(copy.dashboard.deletePhotoConfirm)) return

    setError(null)
    startTransition(async () => {
      const result = await deleteAvatarAction(profileId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <div className="avatar-upload-grid" style={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr)',
        gap: 14,
        alignItems: 'center',
      }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          border: '0.5px solid var(--border)',
          background: 'var(--surface2)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text3)',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {currentAvatar ? (
            <Image
              src={currentAvatar.url}
              alt={copy.dashboard.profilePhoto}
              width={96}
              height={96}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            copy.dashboard.photo
          )}
        </div>

        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          {currentAvatar && (
            <div title={currentAvatar.name} style={{
              fontSize: 12,
              color: 'var(--text2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {currentAvatar.name}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.webp"
            style={{ display: 'none' }}
            onChange={event => uploadSelected(event.target.files?.[0])}
          />
          <button type="button" disabled={pending} onClick={() => fileRef.current?.click()} style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 0,
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            {pending ? copy.dashboard.uploading : currentAvatar ? copy.dashboard.replacePhoto : copy.dashboard.uploadPhoto}
          </button>
          {currentAvatar && (
            <button type="button" disabled={pending} onClick={handleDelete} style={{
              background: 'transparent',
              color: 'var(--danger-text)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}>
              {copy.dashboard.deletePhoto}
            </button>
          )}
        </div>
      </div>

      <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 10 }}>
        {copy.dashboard.avatarHint}
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          color: 'var(--danger-text)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          marginTop: 10,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
