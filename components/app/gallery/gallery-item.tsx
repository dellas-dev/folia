'use client'

import { useState, useTransition } from 'react'
import { Download, Globe, LoaderCircle } from 'lucide-react'

import type { GalleryItemData } from '@/lib/gallery'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type GalleryItemProps = {
  item: GalleryItemData
}

export function GalleryItem({ item }: GalleryItemProps) {
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

      if (!response.ok) {
        setError(data.error || 'Failed to update visibility.')
        return
      }

      setIsPublic((current) => !current)
    })
  }

  return (
    <article className="break-inside-avoid overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
      <div className="bg-[linear-gradient(135deg,oklch(0.97_0.01_84),oklch(0.93_0.03_145))] p-4">
        <img src={item.signed_url} alt={`${item.type} generated artwork`} className="h-auto w-full rounded-[1.2rem] object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.type}</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{item.style ? item.style.replace('_', ' ') : item.scene_preset ?? 'Mockup'}</h3>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('en-US')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={item.signed_url} download className={cn(buttonVariants({ size: 'sm' }))}>
            <Download className="size-4" />
            Download
          </a>
          <button type="button" onClick={togglePublic} disabled={isPending} className={cn(buttonVariants({ variant: isPublic ? 'default' : 'outline', size: 'sm' }))}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Globe className="size-4" />}
            {isPublic ? 'Public' : 'Make public'}
          </button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </article>
  )
}
