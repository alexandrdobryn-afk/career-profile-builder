'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ProjectImageGallery } from './ProjectImageGallery'
import type { Project } from '@/lib/queries'

interface PortfolioLabels {
  title: string
  showAll: string
  collapse: string
  openPdf: string
}

const previewLimit = 4

export function PublicPortfolio({ projects, labels }: { projects: Project[]; labels: PortfolioLabels }) {
  const [expanded, setExpanded] = useState(projects.length <= previewLimit)
  const visibleProjects = expanded ? projects : projects.slice(0, previewLimit)
  const canToggle = projects.length > previewLimit

  return (
    <section id="portfolio" style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 22,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '.5px',
          color: 'var(--text3)',
        }}>
          {labels.title}
        </div>
        {canToggle && (
          <button
            type="button"
            onClick={() => setExpanded(current => !current)}
            style={{
              background: expanded ? 'transparent' : 'var(--accent)',
              border: expanded ? '0.5px solid var(--border)' : 'none',
              borderRadius: 'var(--radius-sm)',
              color: expanded ? 'var(--text2)' : '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              padding: '7px 12px',
              whiteSpace: 'nowrap',
            }}
          >
            {expanded ? labels.collapse : labels.showAll}
          </button>
        )}
      </div>

      {expanded ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {visibleProjects.map(project => (
            <FullProjectCard key={project.id} project={project} openPdfLabel={labels.openPdf} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10,
        }}>
          {visibleProjects.map(project => (
            <CompactProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  )
}

function CompactProjectCard({ project }: { project: Project }) {
  const image = project.files?.find(file => file.file_type.startsWith('image/'))

  return (
    <article style={{
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      background: 'var(--surface2)',
      minHeight: 190,
    }}>
      <div style={{ height: 112, background: 'var(--surface)' }}>
        {image ? (
          <Image
            src={image.public_url}
            alt={image.file_name || project.title}
            width={360}
            height={220}
            unoptimized
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text3)',
            fontSize: 12,
          }}>
            {project.title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{project.title}</h2>
        {project.role && <div style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, lineHeight: 1.35 }}>{project.role}</div>}
      </div>
    </article>
  )
}

function FullProjectCard({ project, openPdfLabel }: { project: Project; openPdfLabel: string }) {
  const projectSkills = project.skills ? project.skills.split(',').map(skill => skill.trim()).filter(Boolean) : []
  const imageFiles = project.files?.filter(file => file.file_type.startsWith('image/')) || []
  const pdfFiles = project.files?.filter(file => file.file_type === 'application/pdf') || []

  return (
    <article style={{
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 16,
    }}>
      {imageFiles.length > 0 && (
        <ProjectImageGallery images={imageFiles} title={project.title} />
      )}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{project.title}</h2>
      {project.role && <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{project.role}</div>}
      {project.description && <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{project.description}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        {projectSkills.map(skill => (
          <span key={skill} style={{
            fontSize: 11,
            background: 'var(--surface2)',
            border: '0.5px solid var(--border)',
            color: 'var(--text2)',
            padding: '4px 9px',
            borderRadius: 20,
          }}>{skill}</span>
        ))}
        {project.links?.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}
          >
            {link.label}
          </a>
        ))}
        {pdfFiles.map(file => (
          <a key={file.id} href={file.public_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>{openPdfLabel}</a>
        ))}
      </div>
    </article>
  )
}
