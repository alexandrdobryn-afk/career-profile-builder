'use client'

import { useState } from 'react'

export function PublicSkills({
  skills,
  title,
  showLabel,
  hideLabel,
}: {
  skills: string[]
  title: string
  showLabel: string
  hideLabel: string
}) {
  const [expanded, setExpanded] = useState(false)

  if (skills.length === 0) return null

  return (
    <section className="public-skills-card" style={{
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
          {title}
        </div>
        {skills.length > 10 && (
          <button
            type="button"
            className="mobile-only-button"
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
            {expanded ? hideLabel : showLabel}
          </button>
        )}
      </div>

      <div className={expanded ? 'skills-cloud skills-cloud-expanded' : 'skills-cloud'} style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 7,
      }}>
        {skills.map(skill => (
          <span key={skill} style={{
            fontSize: 12,
            background: 'var(--surface2)',
            border: '0.5px solid var(--border)',
            color: 'var(--text2)',
            padding: '5px 10px',
            borderRadius: 20,
          }}>{skill}</span>
        ))}
      </div>
    </section>
  )
}
