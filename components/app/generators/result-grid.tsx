'use client'

import { useEffect, useState } from 'react'

import { ResultCard } from '@/components/app/generators/result-card'
import { cn } from '@/lib/utils'
import type { GenerationResult } from '@/types'

type ResultGridProps = {
  results: GenerationResult[]
  promptEnhanced?: string | null
  isGenerating?: boolean
  numExpected?: number
}

const STEPS = [
  { label: 'Enhancing your prompt with Folia AI', ms: 5000 },
  { label: 'Generating image with Folia AI', ms: 30000 },
  { label: 'Almost there…', ms: Infinity },
] as const

function GeneratingPanel({ numExpected }: { numExpected: number }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    setStepIndex(0)
    const t1 = setTimeout(() => setStepIndex(1), STEPS[0].ms)
    const t2 = setTimeout(() => setStepIndex(2), STEPS[1].ms)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const barWidth = stepIndex === 0 ? '20%' : stepIndex === 1 ? '60%' : '88%'

  return (
    <div className="rounded-[1.8rem] border border-border/70 bg-card/85 p-5 shadow-sm shadow-black/5">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Generating {numExpected} image{numExpected > 1 ? 's' : ''}</p>

      <div className="mt-4 space-y-3">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 text-sm transition-opacity duration-500',
              i <= stepIndex ? 'opacity-100' : 'opacity-25'
            )}
          >
            <span className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
              i < stepIndex
                ? 'bg-primary text-primary-foreground'
                : i === stepIndex
                  ? 'animate-pulse bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
            )}>
              {i < stepIndex ? '✓' : i + 1}
            </span>
            <span className={cn(
              'transition-colors',
              i === stepIndex ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-[2000ms] ease-out"
          style={{ width: barWidth }}
        />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
      <div className="aspect-square animate-pulse bg-[linear-gradient(135deg,oklch(0.94_0.01_84),oklch(0.90_0.02_145))]">
        <div className="flex h-full items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-3 w-24 rounded-full bg-muted-foreground/20" />
            <div className="mx-auto h-3 w-16 rounded-full bg-muted-foreground/10" />
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-10 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function ResultGrid({ results, promptEnhanced, isGenerating, numExpected = 1 }: ResultGridProps) {
  if (isGenerating) {
    return (
      <section className="space-y-5">
        <GeneratingPanel numExpected={numExpected} />
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: numExpected }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (results.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Your generated images will appear here.</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Pick a style, describe the element you need, then generate. Folia will return high-quality clipart JPEGs with white backgrounds.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[1.8rem] border border-border/70 bg-card/85 p-5 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Enhanced prompt</p>
        <p className="mt-3 text-sm leading-7 text-foreground/80">{promptEnhanced}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {results.map((result) => (
          <ResultCard key={result.r2_key} result={result} />
        ))}
      </div>
    </section>
  )
}
