'use client'

import { useRef, useState, useTransition } from 'react'
import { deleteResumeAction, setResumePublicAction, uploadResumeAction } from '@/lib/actions'

interface ResumeUploadProps {
  profileId: string
  currentResume?: { name: string; date: string; url: string; isPublic: boolean } | null
}

export function ResumeUpload({ profileId, currentResume }: ResumeUploadProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(currentResume?.isPublic ?? true)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData(formRef.current!)

    setError(null)
    startTransition(async () => {
      const result = await uploadResumeAction(formData)
      if (result?.error) setError(result.error)
      else {
        setPreview(null)
        setIsPublic(true)
        if (fileRef.current) fileRef.current.value = ''
      }
    })
  }

  const handleDelete = () => {
    if (!window.confirm('Удалить резюме?')) return

    setError(null)
    startTransition(async () => {
      const result = await deleteResumeAction(profileId)
      if (result?.error) setError(result.error)
    })
  }

  const handleVisibility = (checked: boolean) => {
    setIsPublic(checked)
    setError(null)
    startTransition(async () => {
      const result = await setResumePublicAction(profileId, checked)
      if (result?.error) {
        setError(result.error)
        setIsPublic(!checked)
      }
    })
  }

  return (
    <div style={{ minWidth: 0 }}>
      {currentResume && (
        <div style={{
          background: 'var(--surface2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 14,
          display: 'grid',
          gap: 12,
          marginBottom: 12,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px minmax(0, 1fr)',
            alignItems: 'center',
            gap: 12,
            minWidth: 0,
          }}>
            <div style={{
              width: 36,
              height: 36,
              background: 'var(--accent-bg)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}>
              CV
            </div>
            <div style={{ minWidth: 0 }}>
              <div title={currentResume.name} style={{
                fontSize: 13,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {currentResume.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{currentResume.date}</div>
            </div>
          </div>

          <label style={{
            display: 'grid',
            gridTemplateColumns: '16px minmax(0, 1fr)',
            alignItems: 'start',
            gap: 8,
            color: 'var(--text2)',
            fontSize: 12,
            lineHeight: 1.45,
            textTransform: 'none',
            letterSpacing: 0,
            margin: 0,
            minWidth: 0,
          }}>
            <input
              type="checkbox"
              checked={isPublic}
              disabled={pending}
              onChange={event => handleVisibility(event.target.checked)}
              style={{ width: 15, height: 15, padding: 0, marginTop: 1 }}
            />
            <span>Показывать резюме на публичной странице</span>
          </label>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            minWidth: 0,
          }}>
            <a href={currentResume.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 12,
              color: 'var(--accent)',
              textDecoration: 'none',
              padding: '8px 10px',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              minWidth: 0,
            }}>
              Открыть
            </a>
            <button type="button" disabled={pending} onClick={handleDelete} style={{
              background: 'transparent',
              color: 'var(--danger-text)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontSize: 12,
              cursor: 'pointer',
              minWidth: 0,
            }}>
              Удалить
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          color: 'var(--danger-text)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          marginBottom: 10,
        }}>{error}</div>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        <input type="hidden" name="profileId" value={profileId} />
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".pdf,.html,.htm,.docx,.txt"
          style={{ display: 'none' }}
          onChange={event => setPreview(event.target.files?.[0]?.name || null)}
        />

        {preview ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              background: 'var(--success-bg)',
              color: 'var(--success-text)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              marginBottom: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              Выбран файл: {preview}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                style={{
                  background: 'transparent',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  color: 'var(--text2)',
                }}>
                Отмена
              </button>
              <button type="submit" disabled={pending} style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                {pending ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              fontSize: 13,
              color: 'var(--text2)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {currentResume ? 'Загрузить новое резюме' : 'Загрузить резюме'}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>PDF, HTML, DOCX, TXT до 10 МБ</div>
          </button>
        )}
      </form>
    </div>
  )
}
