'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { Download, Globe, Leaf, LoaderCircle, Sparkles, X, ZoomIn } from 'lucide-react'

import type { GalleryItemData } from '@/lib/gallery'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type GalleryItemProps = {
  item: GalleryItemData
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

function buildGenerateSimilarHref(item: GalleryItemData) {
  if (item.type !== 'element' || !item.style || !item.prompt_raw) {
    return null
  }

  const params = new URLSearchParams({
    style: item.style,
    prompt: item.prompt_raw,
  })

  return `/elements?${params.toString()}`
}

function ImageFallback({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-[1.1rem] bg-[#F1EFE8] text-center', className)}>
      <Leaf className="size-9 text-[#5C9060]" />
      <p className="text-xs text-muted-foreground">Image unavailable</p>
    </div>
  )
}

function Lightbox({ item, onClose }: { item: GalleryItemData; onClose: () => void }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10"
      style={{ backgroundColor: 'rgba(0,0,0,0.84)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" />

      <div
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.8rem] bg-card shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          aria-label="Close preview"
        >
          <X className="size-4" />
        </button>

        {/* Image */}
        <div className="bg-white p-6">
          {imageFailed ? (
            <ImageFallback className="min-h-[420px] w-full" />
          ) : (
            <img
              src={item.signed_url}
              alt={`${item.type} — ${styleLabel(item.style, item.scene_preset)}`}
              className="max-h-[62vh] w-full object-contain"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{item.type}</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-foreground">
              {styleLabel(item.style, item.scene_preset)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
          </div>
          <a
            href={item.signed_url}
            download={`folia-${item.type}-${item.id.slice(0, 8)}.png`}
            className={cn(buttonVariants({ size: 'sm' }))}
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
  const [imageFailed, setImageFailed] = useState(false)
  const generateSimilarHref = buildGenerateSimilarHref(item)

  function togglePublic() {
    startTransition(async () => {
      setError(null)

      const response = await fetch('/api/gallery/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: item.id, is_public: !isPublic }),
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        setError(data.error || 'Failed to update visibility.')
        return
      }

      setIsPublic((current) => !current)
    })
  }

  return (
    <>
      <article className="group break-inside-avoid overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5 transition-transform duration-200 hover:scale-[1.02] hover:shadow-md hover:shadow-black/10">
        {/* Thumbnail — clickable for lightbox */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative w-full bg-white p-3"
          aria-label="Open full preview"
        >
          {imageFailed ? (
            <ImageFallback className="min-h-[260px] w-full" />
          ) : (
            <img
              src={item.signed_url}
              alt={`${item.type} — ${styleLabel(item.style, item.scene_preset)}`}
              className="h-auto w-full cursor-zoom-in rounded-[1.1rem] object-cover transition-opacity group-hover:opacity-90"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          )}
          {/* Zoom hint overlay */}
          <div className="absolute inset-3 flex items-center justify-center rounded-[1.1rem] bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <ZoomIn className="size-3.5" />
              Preview
            </div>
          </div>
        </button>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.type}</p>
              <h3 className="mt-1 text-sm font-semibold capitalize text-foreground">
                {styleLabel(item.style, item.scene_preset)}
              </h3>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={item.signed_url}
              download={`folia-${item.type}-${item.id.slice(0, 8)}.png`}
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              <Download className="size-4" />
              Download
            </a>
            {generateSimilarHref ? (
              <Link href={generateSimilarHref} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                <Sparkles className="size-4" />
                Generate similar
              </Link>
            ) : null}
            <button
              type="button"
              onClick={togglePublic}
              disabled={isPending}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'pointer-events-none text-xs text-muted-foreground opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
              )}
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Globe className="size-4" />}
              {isPublic ? 'Public' : 'Make public'}
            </button>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </article>

      {lightboxOpen ? <Lightbox item={item} onClose={() => setLightboxOpen(false)} /> : null}
    </>
  )
}
