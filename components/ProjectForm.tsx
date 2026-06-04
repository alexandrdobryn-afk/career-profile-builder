'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { createProjectAction, updateProjectAction } from '@/lib/actions'

type ActionResult = { error?: string; success?: boolean } | undefined

interface ProjectLinkData {
  id?: string
  label: string
  url: string
}

interface ProjectData {
  id: string
  title: string
  role: string
  description: string
  skills: string
  project_url: string
  links?: ProjectLinkData[]
}

const linkPresets = [
  { label: 'GitHub', placeholder: 'https://github.com/...' },
  { label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { label: 'Live demo', placeholder: 'https://example.com' },
  { label: 'Website', placeholder: 'https://example.com' },
]

function getInitialLinks(project?: ProjectData): ProjectLinkData[] {
  if (!project) return []
  if (project.links?.length) {
    return project.links.map(link => ({ id: link.id, label: link.label, url: link.url }))
  }
  if (project.project_url) {
    return [{ label: 'Project', url: project.project_url }]
  }
  return []
}

export function ProjectForm({ profileId, project }: { profileId: string; project?: ProjectData }) {
  const action = project ? updateProjectAction : createProjectAction
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [links, setLinks] = useState<ProjectLinkData[]>(getInitialLinks(project))
  const fileRef = useRef<HTMLInputElement>(null)

  function addLink(label = '', url = '') {
    setLinks(current => [...current, { label, url }])
  }

  function updateLink(index: number, field: keyof ProjectLinkData, value: string) {
    setLinks(current => current.map((link, itemIndex) => (
      itemIndex === index ? { ...link, [field]: value } : link
    )))
  }

  function removeLink(index: number) {
    setLinks(current => current.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px', maxWidth: 720,
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
        <input type="hidden" name="linkCount" value={links.length} />
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
          <textarea
            name="description"
            placeholder="Что сделано, какую проблему решает проект, какие результаты видны."
            defaultValue={project?.description}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Навыки и инструменты</label>
          <input name="skills" placeholder="Python, OpenAI API, FastAPI" defaultValue={project?.skills} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Ссылки проекта</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: links.length ? 12 : 10 }}>
            {linkPresets.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => addLink(preset.label)}
                style={{
                  background: 'transparent',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text2)',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '6px 10px',
                }}
              >
                + {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => addLink()}
              style={{
                background: 'var(--surface2)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 10px',
              }}
            >
              + Другая ссылка
            </button>
          </div>

          {links.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {links.map((link, index) => (
                <div key={`${link.id || 'new'}-${index}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '150px minmax(0,1fr) auto',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <input
                    name={`link_label_${index}`}
                    placeholder="GitHub"
                    value={link.label}
                    onChange={event => updateLink(index, 'label', event.target.value)}
                  />
                  <input
                    name={`link_url_${index}`}
                    placeholder={linkPresets.find(preset => preset.label === link.label)?.placeholder || 'https://...'}
                    value={link.url}
                    onChange={event => updateLink(index, 'url', event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    aria-label="Удалить ссылку"
                    style={{
                      background: 'transparent',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--danger-text)',
                      cursor: 'pointer',
                      height: 38,
                      padding: '0 12px',
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
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
