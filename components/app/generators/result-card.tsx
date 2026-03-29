'use client'

import { Download, Globe } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GenerationResult } from '@/types'

type ResultCardProps = {
  result: GenerationResult
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
      <div className="aspect-square bg-[linear-gradient(135deg,oklch(0.97_0.01_84),oklch(0.93_0.03_145))] p-4">
        <img src={result.signed_url} alt={`Generated clipart ${result.index + 1}`} className="h-full w-full rounded-[1.1rem] object-contain" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Result {result.index + 1}</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">PNG</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={result.signed_url} download className={cn(buttonVariants({ size: 'lg' }))}>
            <Download className="size-4" />
            Download
          </a>
          <button type="button" disabled className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            <Globe className="size-4" />
            Make public
          </button>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">Public gallery opt-in lands in Phase 4. Download links stay valid for 7 days.</p>
      </div>
    </article>
  )
}
