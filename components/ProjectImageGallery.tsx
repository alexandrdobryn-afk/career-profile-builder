'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface GalleryImage {
  id: string
  public_url: string
  file_name: string
}

export function ProjectImageGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeImage = activeIndex === null ? null : images[activeIndex]
  const hasMany = images.length > 1

  const gridColumns = useMemo(() => (
    images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))'
  ), [images.length])

  const close = useCallback(function close() {
    setActiveIndex(null)
  }, [])

  const goNext = useCallback(function goNext() {
    setActiveIndex(current => current === null ? current : (current + 1) % images.length)
  }, [images.length])

  const goPrevious = useCallback(function goPrevious() {
    setActiveIndex(current => current === null ? current : (current - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (activeIndex === null) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') goPrevious()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, close, goNext, goPrevious])

  if (images.length === 0) return null

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: 8,
        marginBottom: 12,
      }}>
        {images.map((file, index) => (
          <button
            key={file.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Open ${file.file_name || title}`}
            style={{
              height: 180,
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: 'var(--surface2)',
              border: 'none',
              cursor: 'zoom-in',
              display: 'block',
              padding: 0,
              width: '100%',
            }}
          >
            <Image
              src={file.public_url}
              alt={file.file_name || title}
              width={820}
              height={420}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>

      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={event => {
            if (event.target === event.currentTarget) close()
          }}
          className="lightbox-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(0,0,0,.78)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div className="lightbox-frame" style={{
            position: 'relative',
            width: 'min(100%, 980px)',
            height: 'min(82vh, 680px)',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,.45)',
          }}>
            <Image
              src={activeImage.public_url}
              alt={activeImage.file_name || title}
              width={1400}
              height={900}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#050505' }}
            />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={iconButtonStyle('top', 'right')}
            >
              x
            </button>

            {hasMany && (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Previous image"
                  style={iconButtonStyle('middle', 'left')}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next image"
                  style={iconButtonStyle('middle', 'right')}
                >
                  &gt;
                </button>
              </>
            )}

            <div style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              color: '#fff',
              fontSize: 12,
              pointerEvents: 'none',
              textShadow: '0 1px 8px rgba(0,0,0,.8)',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeImage.file_name || title}
              </span>
              {hasMany && activeIndex !== null && <span>{activeIndex + 1}/{images.length}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function iconButtonStyle(vertical: 'top' | 'middle', horizontal: 'left' | 'right'): CSSProperties {
  return {
    position: 'absolute',
    top: vertical === 'top' ? 12 : '50%',
    [horizontal]: 12,
    transform: vertical === 'middle' ? 'translateY(-50%)' : undefined,
    width: 42,
    height: 42,
    borderRadius: 999,
    border: '0.5px solid rgba(255,255,255,.22)',
    background: 'rgba(0,0,0,.48)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: vertical === 'top' ? 26 : 34,
    lineHeight: 1,
    display: 'grid',
    placeItems: 'center',
  }
}
