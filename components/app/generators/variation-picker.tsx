'use client'

import { Lock } from 'lucide-react'

import { cn } from '@/lib/utils'

type VariationPickerProps = {
  value: 1 | 2 | 3 | 4
  maxVariations: number
  onChange: (value: 1 | 2 | 3 | 4) => void
}

const options = [1, 2, 3, 4] as const

export function VariationPicker({ value, maxVariations, onChange }: VariationPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm font-medium text-foreground">Variations</p>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits spent = images returned</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {options.map((option) => {
          const locked = option > maxVariations

          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => onChange(option)}
              className={cn(
                'flex min-h-16 items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition-colors',
                value === option
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-card text-foreground hover:bg-accent/50',
                locked && 'cursor-not-allowed opacity-60 hover:bg-card'
              )}
            >
              {locked ? <Lock className="size-4" /> : null}
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
