'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Contrast, Download, ImageOff, PanelsTopLeft, Scissors } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GenerationResult } from '@/types'

type BgMode = 'white' | 'gray' | 'dark'

const BG_CYCLE: Record<BgMode, BgMode> = { white: 'gray', gray: 'dark', dark: 'white' }

const BG_COLORS: Record<BgMode, string> = {
  white: '#ffffff',
  gray: '#e0e0e0',
  dark: '#1e2a2f',
}

const BG_LABELS: Record<BgMode, string> = {
  white: 'White bg',
  gray: 'Gray bg',
  dark: 'Dark bg',
}

type ResultCardProps = {
  result: GenerationResult
}

export function ResultCard({ result }: ResultCardProps) {
  const [imgError, setImgError] = useState(false)
  const [bgMode, setBgMode] = useState<BgMode>('white')
  const format = result.format ?? 'png'
  const formatLabel = format.toUpperCase()

  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
      <div
        className="relative aspect-square p-4 transition-colors duration-300"
        style={{ backgroundColor: BG_COLORS[bgMode] }}
      >
        {/* Background toggle */}
        <button
          type="button"
          onClick={() => setBgMode((m) => BG_CYCLE[m])}
          title={`Background: ${BG_LABELS[bgMode]} — click to cycle`}
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors hover:bg-black/40"
        >
          <Contrast className="size-3" />
          {BG_LABELS[bgMode]}
        </button>

        {imgError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[1.1rem] border border-dashed border-destructive/40 bg-destructive/5 text-center">
            <ImageOff className="size-8 text-destructive/60" />
            <p className="text-xs text-destructive/70">Image failed to load</p>
          </div>
        ) : (
          <img
            src={result.signed_url}
            alt={`Generated clipart ${result.index + 1}`}
            className="h-full w-full rounded-[1.1rem] object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Result {result.index + 1}</h3>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">{formatLabel}</span>
        </div>
        <a
          href={result.signed_url}
          download={`folia-clipart-${result.index + 1}.${format}`}
          className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
        >
          <Download className="size-4" />
          Download {formatLabel}
        </a>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/remove-bg?r2_key=${encodeURIComponent(result.r2_key)}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
          >
            <Scissors className="size-3.5" />
            Remove BG
          </Link>
          <Link
            href={`/mockups?r2_key=${encodeURIComponent(result.r2_key)}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
          >
            <PanelsTopLeft className="size-3.5" />
            Use in Mockup
          </Link>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">White background · Download links valid for 7 days.</p>
      </div>
    </article>
  )
}
