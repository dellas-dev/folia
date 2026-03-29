'use client'

import type { IllustrationStyle, StyleOption } from '@/types'
import { cn } from '@/lib/utils'

type StyleSelectorProps = {
  options: StyleOption[]
  value: IllustrationStyle
  onChange: (value: IllustrationStyle) => void
}

export function StyleSelector({ options, value, onChange }: StyleSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {options.map((option) => {
        const isActive = option.id === value

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-[1.6rem] border p-4 text-left transition-all',
              isActive
                ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                : 'border-border/70 bg-card hover:border-primary/40 hover:bg-accent/50'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl">{option.emoji}</span>
              <span className="rounded-full bg-background/80 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Style
              </span>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-foreground">{option.label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Best for {option.bestFor.toLowerCase()}.</p>
          </button>
        )
      })}
    </div>
  )
}
