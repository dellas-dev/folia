'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

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
  { label: 'Folia is refining your prompt', ms: 5000 },
  { label: 'Folia is generating your artwork', ms: 30000 },
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

  const barWidth = stepIndex === 0 ? '20%' : stepIndex === 1 ? '62%' : '88%'

  return (
    <div
      className="rounded-[1.25rem] p-5"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 8px 24px rgba(55,101,107,0.06)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>
        Generating {numExpected} image{numExpected > 1 ? 's' : ''}
      </p>

      <div className="mt-4 space-y-3">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-3 text-sm transition-opacity duration-500', i <= stepIndex ? 'opacity-100' : 'opacity-25')}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                i < stepIndex ? 'text-white' : i === stepIndex ? 'animate-pulse' : ''
              )}
              style={{
                backgroundColor: i < stepIndex
                  ? '#37656b'
                  : i === stepIndex
                    ? 'rgba(55,101,107,0.15)'
                    : '#eeeeee',
                color: i < stepIndex ? '#ffffff' : i === stepIndex ? '#37656b' : '#c0c8c9',
              }}
            >
              {i < stepIndex ? '✓' : i + 1}
            </span>
            <span
              className="text-xs transition-colors"
              style={{ color: i === stepIndex ? '#1a1c1c' : '#70787a', fontWeight: i === stepIndex ? 600 : 400 }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#eeeeee' }}>
        <div
          className="h-full rounded-full transition-all duration-[2000ms] ease-out"
          style={{ width: barWidth, background: 'linear-gradient(90deg, #37656b, #507e84)' }}
        />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-[1.25rem]"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(55,101,107,0.05)',
      }}
    >
      <div className="aspect-square animate-pulse" style={{ backgroundColor: '#f4f3f3' }}>
        <div className="flex h-full items-center justify-center">
          <div className="space-y-2.5 text-center">
            <div className="mx-auto h-2.5 w-20 rounded-full" style={{ backgroundColor: '#eeeeee' }} />
            <div className="mx-auto h-2.5 w-14 rounded-full" style={{ backgroundColor: '#eeeeee' }} />
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-16 animate-pulse rounded-full" style={{ backgroundColor: '#eeeeee' }} />
          <div className="h-4 w-10 animate-pulse rounded-full" style={{ backgroundColor: '#eeeeee' }} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-full" style={{ backgroundColor: '#eeeeee' }} />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 animate-pulse rounded-full" style={{ backgroundColor: '#eeeeee' }} />
          <div className="h-9 animate-pulse rounded-full" style={{ backgroundColor: '#eeeeee' }} />
        </div>
      </div>
    </div>
  )
}

export function ResultGrid({ results, promptEnhanced, isGenerating, numExpected = 1 }: ResultGridProps) {
  if (isGenerating) {
    return (
      <section className="space-y-4">
        <GeneratingPanel numExpected={numExpected} />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: numExpected }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    )
  }

  if (results.length === 0) {
    return (
      <div
        className="flex min-h-[28rem] flex-col items-center justify-center gap-4 rounded-[1.25rem] p-8 text-center"
        style={{ backgroundColor: '#f4f3f3' }}
      >
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: '#d1e3e6' }}
        >
          <Sparkles className="size-6" style={{ color: '#37656b' }} />
        </div>
        <div className="max-w-xs">
          <p
            className="text-base font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}
          >
            Your clipart will appear here
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: '#70787a' }}>
            Pick a style, describe what you need, then hit Generate. Elements are delivered as white-background JPGs, and Remove BG turns them into transparent PNGs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {promptEnhanced ? (
        <div
          className="rounded-[1rem] p-4"
          style={{ backgroundColor: '#f4f3f3' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>
            ✨ Folia prompt
          </p>
          <p className="mt-2 text-xs leading-6" style={{ color: '#404849' }}>{promptEnhanced}</p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((result) => (
          <ResultCard key={result.r2_key} result={result} />
        ))}
      </div>
    </section>
  )
}
