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
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
        Visual Style
      </p>
      <div className="overflow-x-auto">
        <div className="flex gap-2.5 pb-1 md:grid md:grid-cols-5">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'group relative flex w-[120px] shrink-0 flex-col overflow-hidden rounded-[1rem] text-left transition-all duration-200 md:w-auto',
                value === option.id
                  ? 'shadow-[0_0_0_2px_#37656b,0_4px_16px_rgba(55,101,107,0.15)]'
                  : 'shadow-[0_2px_8px_rgba(55,101,107,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(55,101,107,0.1)]'
              )}
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className="relative h-20 w-full overflow-hidden" style={{ backgroundColor: '#f4f3f3' }}>
                <img
                  src={option.sampleImage}
                  alt={option.label}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">
                  {option.icon}
                </div>
              </div>
              <div className="px-2.5 py-2 text-center">
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{ color: value === option.id ? '#37656b' : '#1a1c1c' }}
                >
                  {option.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
