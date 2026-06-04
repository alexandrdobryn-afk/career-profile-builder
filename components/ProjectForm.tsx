'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { createProjectAction, updateProjectAction } from '@/lib/actions'
import { useLanguage } from './LanguageProvider'

type ActionResult = { error?: string; success?: boolean } | undefined

interface ProjectLinkData {
  id?: string
  label: string
  url: string
}

interface ProjectFileData {
  id: string
  file_name: string
  file_type: string
  public_url: string
}

interface ProjectData {
  id: string
  title: string
  role: string
  description: string
  skills: string
  project_url: string
  links?: ProjectLinkData[]
  files?: ProjectFileData[]
}

const linkPresets = [
  { label: 'GitHub', placeholder: 'https://github.com/...' },
  { label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { label: 'Live demo', placeholder: 'https://example.com' },
  { label: 'Website', placeholder: 'https://example.com' },
]

const maxProjectFiles = 5

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
  const { copy } = useLanguage()
  const action = project ? updateProjectAction : createProjectAction
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([])
  const [links, setLinks] = useState<ProjectLinkData[]>(getInitialLinks(project))
  const fileRef = useRef<HTMLInputElement>(null)
  const visibleExistingFiles = (project?.files || []).filter(file => !deletedFileIds.includes(file.id))
  const totalFiles = visibleExistingFiles.length + selectedFiles.length
  const fileLimitReached = totalFiles >= maxProjectFiles

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

  function handleFileChange(files: FileList | null) {
    const availableSlots = Math.max(0, maxProjectFiles - visibleExistingFiles.length)
    const names = Array.from(files || []).map(file => file.name).slice(0, availableSlots)
    setSelectedFiles(names)
  }

  function markFileForDelete(fileId: string) {
    setDeletedFileIds(current => current.includes(fileId) ? current : [...current, fileId])
  }

  return (
    <div className="form-panel" style={{
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
        <input type="hidden" name="deleteFileCount" value={deletedFileIds.length} />
        {deletedFileIds.map((fileId, index) => (
          <input key={fileId} type="hidden" name={`delete_file_id_${index}`} value={fileId} />
        ))}
        {project && <input type="hidden" name="projectId" value={project.id} />}

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.project.title}</label>
          <input name="title" required placeholder="FinVoice AI" defaultValue={project?.title} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.project.role}</label>
          <input name="role" placeholder="Lead Developer" defaultValue={project?.role} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.project.description}</label>
          <textarea
            name="description"
            placeholder={copy.dashboard.project.descriptionPlaceholder}
            defaultValue={project?.description}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{copy.dashboard.project.skills}</label>
          <input name="skills" placeholder="Python, OpenAI API, FastAPI" defaultValue={project?.skills} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>{copy.dashboard.project.links}</label>
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
              + {copy.dashboard.project.otherLink}
            </button>
          </div>

          {links.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {links.map((link, index) => (
                <div className="project-link-row" key={`${link.id || 'new'}-${index}`} style={{
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
                    aria-label={copy.dashboard.project.deleteLink}
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
                    {copy.dashboard.delete}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>{copy.dashboard.project.attachment}</label>
          {visibleExistingFiles.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
              {visibleExistingFiles.map(file => (
                <div className="file-row" key={file.id} style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  gap: 8,
                  alignItems: 'center',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  fontSize: 12,
                }}>
                  <a
                    href={file.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {file.file_name}
                  </a>
                  <button
                    type="button"
                    onClick={() => markFileForDelete(file.id)}
                    style={{
                      background: 'transparent',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--danger-text)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '5px 10px',
                    }}
                  >
                    {copy.dashboard.delete}
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            name="files"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleFileChange(e.target.files)}
          />
          <button
            type="button"
            onClick={() => !fileLimitReached && fileRef.current?.click()}
            disabled={fileLimitReached}
            style={{
              width: '100%', background: 'transparent',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '14px', fontSize: 13, color: 'var(--text2)', cursor: fileLimitReached ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              opacity: fileLimitReached ? .65 : 1,
            }}
          >
            {selectedFiles.length > 0
              ? <span style={{ color: 'var(--success-text)' }}>{copy.dashboard.selectedFile}: {selectedFiles.join(', ')}</span>
              : <>{copy.dashboard.project.chooseFile} <span style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{copy.dashboard.project.fileHint}</span></>
            }
          </button>
          <div style={{ fontSize: 11, color: fileLimitReached ? 'var(--warn-text)' : 'var(--text3)', marginTop: 6 }}>
            {totalFiles}/{maxProjectFiles}
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: 10 }}>
          <Link href={`/dashboard/profile/${profileId}`} style={{
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
            {pending ? copy.dashboard.saving : project ? copy.dashboard.saveChanges : copy.dashboard.project.add}
          </button>
        </div>
      </form>
    </div>
  )
}
