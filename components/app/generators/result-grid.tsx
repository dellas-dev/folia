'use client'

import { ResultCard } from '@/components/app/generators/result-card'
import type { GenerationResult } from '@/types'

type ResultGridProps = {
  results: GenerationResult[]
  promptEnhanced?: string | null
}

export function ResultGrid({ results, promptEnhanced }: ResultGridProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/60 p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Your generated PNGs will appear here.</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Pick a style, describe the element you need, then generate. Folia will return isolated clipart results with transparent backgrounds.
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
