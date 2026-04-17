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
    <div className="space-y-2.5">
      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
        Variations
      </p>
      <div className="flex gap-2">
        {options.map((option) => {
          const locked = option > maxVariations
          const isActive = value === option

          return (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => onChange(option)}
              className={cn(
                'flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                isActive && !locked
                  ? 'text-white shadow-[0_4px_12px_rgba(55,101,107,0.3)]'
                  : locked
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:-translate-y-0.5'
              )}
              style={{
                backgroundColor: isActive && !locked
                  ? '#37656b'
                  : locked
                    ? '#eeeeee'
                    : '#eeeeee',
                color: isActive && !locked ? '#ffffff' : locked ? '#c0c8c9' : '#404849',
              }}
            >
              {locked ? <Lock className="size-3.5" /> : option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
