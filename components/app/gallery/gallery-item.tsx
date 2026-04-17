'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Download, LoaderCircle, X, ZoomIn } from 'lucide-react'

import type { GalleryItemData } from '@/lib/gallery'

type GalleryItemProps = { item: GalleryItemData }

function getExtensionFromKey(key: string) {
  const ext = key.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg'
  if (ext === 'webp') return 'webp'
  return 'png'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function styleLabel(style: string | null, scenePreset: string | null): string {
  if (style) return style.replace(/_/g, ' ')
  if (scenePreset) return scenePreset.replace(/-/g, ' ')
  return 'Mockup'
}

function Lightbox({ item, onClose }: { item: GalleryItemData; onClose: () => void }) {
  const fileExtension = getExtensionFromKey(item.result_r2_key)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKeyDown) }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10"
      style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" />

      <div
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] shadow-2xl"
        style={{ backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          aria-label="Close preview"
        >
          <X className="size-4" />
        </button>

        {/* Image */}
        <div className="p-5" style={{ backgroundColor: '#f4f3f3' }}>
          <img
            src={item.signed_url}
            alt={`${item.type} — ${styleLabel(item.style, item.scene_preset)}`}
            className="max-h-[60vh] w-full rounded-[1rem] object-contain"
          />
        </div>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: '#70787a' }}
            >
              {item.type}
            </p>
            <p
              className="mt-0.5 text-sm font-semibold capitalize"
              style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}
            >
              {styleLabel(item.style, item.scene_preset)}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: '#70787a' }}>{formatDate(item.created_at)}</p>
          </div>
          <a
            href={item.signed_url}
            download={`folia-${item.type}-${item.id.slice(0, 8)}.${fileExtension}`}
            className="flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
          >
            <Download className="size-4" />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}

export function GalleryItem({ item }: GalleryItemProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(item.is_public)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function togglePublic() {
    startTransition(async () => {
      setError(null)
      const response = await fetch('/api/gallery/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: item.id, is_public: !isPublic }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) { setError(data.error || 'Failed to update visibility.'); return }
      setIsPublic((current) => !current)
    })
  }

  const label = styleLabel(item.style, item.scene_preset)

  return (
    <>
      <article
        className="break-inside-avoid overflow-hidden rounded-[1.25rem]"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 8px 20px rgba(55,101,107,0.05)',
        }}
      >
        {/* Image */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative w-full"
          aria-label="Open full preview"
        >
          <img
            src={item.signed_url}
            alt={`${item.type} — ${label}`}
            className="h-auto w-full rounded-t-[1.25rem] object-cover transition-opacity group-hover:opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-t-[1.25rem] bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <ZoomIn className="size-3.5" />
              Preview
            </div>
          </div>
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          {/* Style badge */}
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}
          >
            {label}
          </span>

          {/* Right: public toggle + remix */}
          <div className="flex items-center gap-2">
            {/* Visibility toggle */}
            <button
              type="button"
              onClick={togglePublic}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: isPublic ? 'rgba(55,101,107,0.1)' : '#eeeeee',
                color: isPublic ? '#37656b' : '#70787a',
              }}
              title={isPublic ? 'Click to make private' : 'Click to make public'}
            >
              {isPending
                ? <LoaderCircle className="size-3 animate-spin" />
                : <span className="size-1.5 rounded-full inline-block" style={{ backgroundColor: isPublic ? '#37656b' : '#c0c8c9' }} />
              }
              {isPublic ? 'Public' : 'Private'}
            </button>

            <Link
              href={item.type === 'mockup'
                ? `/mockups?r2_key=${encodeURIComponent(item.result_r2_key)}`
                : '/elements'
              }
              className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
            >
              Remix
            </Link>
          </div>
        </div>

        {error ? <p className="px-3 pb-2 text-xs" style={{ color: '#ba1a1a' }}>{error}</p> : null}
      </article>

      {lightboxOpen ? <Lightbox item={item} onClose={() => setLightboxOpen(false)} /> : null}
    </>
  )
}
