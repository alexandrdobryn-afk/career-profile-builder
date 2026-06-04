'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { createProjectAction, updateProjectAction } from '@/lib/actions'

type ActionResult = { error?: string; success?: boolean } | undefined

interface ProjectData {
  id: string
  title: string
  role: string
  description: string
  skills: string
  project_url: string
}

export function ProjectForm({ profileId, project }: { profileId: string; project?: ProjectData }) {
  const action = project ? updateProjectAction : createProjectAction
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px', maxWidth: 640,
    }}>
      {state?.error && (
        <div style={{
          background: 'var(--danger-bg)', color: 'var(--danger-text)',
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: 13, marginBottom: 16,
        }}>{state.error}</div>
      )}

      <form action={formAction} encType="multipart/form-data">
        <input type="hidden" name="profileId" value={profileId} />
        {project && <input type="hidden" name="projectId" value={project.id} />}

        <div style={{ marginBottom: 16 }}>
          <label>Название проекта *</label>
          <input name="title" required placeholder="FinVoice AI" defaultValue={project?.title} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Ваша роль</label>
          <input name="role" placeholder="Lead Developer" defaultValue={project?.role} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Описание проекта</label>
          <textarea name="description" placeholder="Что сделано, какую проблему решает проект, какие результаты видны." defaultValue={project?.description} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Навыки и инструменты</label>
          <input name="skills" placeholder="Python, OpenAI API, FastAPI" defaultValue={project?.skills} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Ссылка на проект или видео</label>
          <input type="url" name="project_url" placeholder="https://github.com/... или https://youtube.com/..." defaultValue={project?.project_url} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Изображение или PDF для онлайн-просмотра</label>
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            style={{ display: 'none' }}
            onChange={e => setFilePreview(e.target.files?.[0]?.name || null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', background: 'transparent',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '14px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {filePreview
              ? <span style={{ color: 'var(--success-text)' }}>Выбран файл: {filePreview}</span>
              : <>Выбрать файл <span style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>PNG, JPG, WEBP, PDF до 10 МБ</span></>
            }
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/dashboard/profile/${profileId}`} style={{
            padding: '9px 20px', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text2)',
            textDecoration: 'none',
          }}>
            Отмена
          </Link>
          <button type="submit" disabled={pending} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '9px 24px', borderRadius: 'var(--radius-sm)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            {pending ? 'Сохранение...' : project ? 'Сохранить изменения' : 'Добавить проект'}
          </button>
        </div>
      </form>
    </div>
  )
}
