'use client'

import { useActionState, useState } from 'react'
import { saveProfileLinksAction } from '@/lib/actions'
import type { ProfileLink } from '@/lib/queries'
import { useLanguage } from './LanguageProvider'

type ActionResult = { error?: string; success?: boolean } | undefined

interface EditableLink {
  key: string
  label: string
  url: string
  isPublic: boolean
}

const presets = ['LinkedIn', 'GitHub', 'YouTube', 'Facebook']

export function ProfileLinksManager({ profileId, links }: { profileId: string; links: ProfileLink[] }) {
  const { copy } = useLanguage()
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(saveProfileLinksAction, undefined)
  const [items, setItems] = useState<EditableLink[]>(
    links.length > 0
      ? links.map(link => ({
          key: link.id,
          label: link.label,
          url: link.url,
          isPublic: link.is_public === 1,
        }))
      : [{ key: crypto.randomUUID(), label: '', url: '', isPublic: true }]
  )

  const updateItem = (key: string, patch: Partial<EditableLink>) => {
    setItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item))
  }

  const addItem = (label = '') => {
    setItems(current => [...current, { key: crypto.randomUUID(), label, url: '', isPublic: true }])
  }

  const removeItem = (key: string) => {
    setItems(current => {
      const next = current.filter(item => item.key !== key)
      return next.length > 0 ? next : [{ key: crypto.randomUUID(), label: '', url: '', isPublic: true }]
    })
  }

  return (
    <div className="form-panel" style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      marginBottom: 14,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.5px',
          color: 'var(--text3)',
        }}>
          {copy.dashboard.links}
        </div>
        <button type="button" onClick={() => addItem()} style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 0,
          borderRadius: 'var(--radius-sm)',
          width: 32,
          height: 32,
          fontSize: 20,
          lineHeight: 1,
          cursor: 'pointer',
        }} aria-label={copy.dashboard.addLink}>
          +
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {presets.map(label => (
          <button key={label} type="button" onClick={() => addItem(label)} style={{
            background: 'var(--surface2)',
            color: 'var(--text2)',
            border: '0.5px solid var(--border)',
            borderRadius: 20,
            padding: '5px 10px',
            fontSize: 12,
            cursor: 'pointer',
          }}>
            + {label}
          </button>
        ))}
      </div>

      {state?.error && (
        <div style={{
          background: 'var(--danger-bg)',
          color: 'var(--danger-text)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          marginBottom: 10,
        }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div style={{
          background: 'var(--success-bg)',
          color: 'var(--success-text)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          marginBottom: 10,
        }}>
          {copy.dashboard.linksSaved}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="linkCount" value={items.length} />

        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item, index) => (
            <div key={item.key} style={{
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              display: 'grid',
              gap: 8,
            }}>
              <div className="profile-link-row" style={{ display: 'grid', gridTemplateColumns: '130px minmax(0,1fr) auto', gap: 8, alignItems: 'center' }}>
                <input
                  name={`label_${index}`}
                  placeholder="LinkedIn"
                  value={item.label}
                  onChange={event => updateItem(item.key, { label: event.target.value })}
                />
                <input
                  name={`url_${index}`}
                  placeholder="https://linkedin.com/in/..."
                  value={item.url}
                  onChange={event => updateItem(item.key, { url: event.target.value })}
                />
                <button type="button" onClick={() => removeItem(item.key)} style={{
                  background: 'transparent',
                  color: 'var(--text3)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  width: 34,
                  height: 34,
                  cursor: 'pointer',
                }} aria-label={copy.dashboard.deleteLink}>
                  ×
                </button>
              </div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text2)',
                fontSize: 12,
                textTransform: 'none',
                letterSpacing: 0,
                margin: 0,
              }}>
                <input
                  name={`public_${index}`}
                  type="checkbox"
                  checked={item.isPublic}
                  onChange={event => updateItem(item.key, { isPublic: event.target.checked })}
                  style={{ width: 15, height: 15, padding: 0 }}
                />
                {copy.dashboard.showPublic}
              </label>
            </div>
          ))}
        </div>

        <button type="submit" disabled={pending} style={{
          marginTop: 12,
          background: 'var(--accent)',
          color: '#fff',
          border: 0,
          borderRadius: 'var(--radius-sm)',
          padding: '9px 16px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          {pending ? copy.dashboard.saving : copy.dashboard.saveLinks}
        </button>
      </form>
    </div>
  )
}
