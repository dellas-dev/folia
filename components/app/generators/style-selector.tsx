'use client'

import { cn } from '@/lib/utils'
import type { IllustrationStyle, StyleOption } from '@/types'

type StyleSelectorProps = {
  options: StyleOption[]
  value: IllustrationStyle
  onChange: (value: IllustrationStyle) => void
}

export function StyleSelector({ options, value, onChange }: StyleSelectorProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-1 md:grid md:grid-cols-5">
      {options.map((option) => {
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex w-[120px] shrink-0 flex-col overflow-hidden rounded-2xl border text-left transition-all md:w-auto',
              value === option.id
                ? 'border-[#D4A843] bg-[#D4A843]/5 shadow-sm'
                : 'border-border/60 bg-card hover:border-border'
            )}
          >
            <div className="relative h-20 w-full overflow-hidden bg-muted/40">
              <img
                src={option.sampleImage}
                alt={option.label}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">
                {option.icon}
              </div>

              {value === option.id && (
                <span className="absolute right-2 top-2 rounded-full bg-[#D4A843] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#2C2C2A]">
                  Active
                </span>
              )}
            </div>

            <div className="p-2.5">
              <p className="text-xs leading-tight font-semibold text-foreground">
                {option.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                {option.description}
              </p>
            </div>
          </button>
        )
      })}
      </div>
    </div>
  )
}
