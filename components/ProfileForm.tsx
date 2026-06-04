'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createProfileAction, updateProfileAction } from '@/lib/actions'
import { useLanguage } from './LanguageProvider'

type ActionResult = { error?: string; success?: boolean } | undefined

interface Profile {
  id: string
  title: string
  public_slug: string
  is_public: number
  first_name: string
  last_name: string
  role: string
  bio: string
  skills: string
  location: string
  contact_email: string
  website_url: string
}

export function ProfileForm({ profile }: { profile?: Profile }) {
  const { copy } = useLanguage()
  const action = profile ? updateProfileAction : createProfileAction
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined)

  return (
    <div className="form-panel" style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px', maxWidth: 680,
    }}>
      {state?.error && (
        <div style={{
          background: 'var(--danger-bg)', color: 'var(--danger-text)',
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: 13, marginBottom: 16,
        }}>{state.error}</div>
      )}

      <form action={formAction}>
        {profile && <input type="hidden" name="profileId" value={profile.id} />}

        <div className="profile-slug-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <label>{copy.dashboard.profileTitle}</label>
            <input name="title" required placeholder="AI Automation Developer" defaultValue={profile?.title} />
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '9px 12px',
            textTransform: 'none', letterSpacing: 0, margin: 0,
          }}>
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={profile ? profile.is_public === 1 : true}
              style={{ width: 16, height: 16, padding: 0 }}
            />
            {copy.dashboard.publish}
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.publicLink}</label>
          <div className="field-prefix-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
            <span style={{
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              borderRight: 0, borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
              padding: '9px 12px', color: 'var(--text3)', fontSize: 14,
            }}>/p/</span>
            <input
              name="public_slug"
              placeholder="ai-automation-developer"
              defaultValue={profile?.public_slug}
              style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
            />
          </div>
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ marginBottom: 16 }}>
            <label>{copy.dashboard.firstName}</label>
            <input name="first_name" placeholder="Ivan" defaultValue={profile?.first_name} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>{copy.dashboard.lastName}</label>
            <input name="last_name" placeholder="Dobryn" defaultValue={profile?.last_name} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.role}</label>
          <input name="role" placeholder="AI Engineer, Automation Specialist" defaultValue={profile?.role} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.bio}</label>
          <textarea name="bio" placeholder={copy.dashboard.bioPlaceholder} defaultValue={profile?.bio} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.skillsComma}</label>
          <input name="skills" placeholder="Python, OpenAI API, Make.com, FastAPI" defaultValue={profile?.skills} />
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ marginBottom: 20 }}>
            <label>{copy.dashboard.location}</label>
            <input name="location" placeholder="Kyiv / Remote" defaultValue={profile?.location} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>{copy.dashboard.contactEmail}</label>
            <input type="email" name="contact_email" placeholder="you@example.com" defaultValue={profile?.contact_email} />
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={profile ? `/dashboard/profile/${profile.id}` : '/dashboard'} style={{
            padding: '9px 20px', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text2)',
            textDecoration: 'none',
          }}>
            {copy.dashboard.cancel}
          </Link>
          <button type="submit" disabled={pending} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '9px 24px', borderRadius: 'var(--radius-sm)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            {pending ? copy.dashboard.saving : profile ? copy.dashboard.saveChanges : copy.dashboard.createProfile}
          </button>
        </div>
      </form>
    </div>
  )
}
