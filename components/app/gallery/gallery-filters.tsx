import Link from 'next/link'

import { cn } from '@/lib/utils'
import { STYLE_OPTIONS, type IllustrationStyle } from '@/types'

type GalleryFiltersProps = {
  currentType?: 'all' | 'element' | 'mockup'
  currentStyle?: IllustrationStyle | 'all'
}

const typeOptions = [
  { value: 'all',     label: 'All Assets' },
  { value: 'element', label: 'Elements' },
  { value: 'mockup',  label: 'Mockups' },
] as const

export function GalleryFilters({ currentType = 'all', currentStyle = 'all' }: GalleryFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Type tabs */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] mr-1" style={{ color: '#70787a' }}>
          Type
        </span>
        {typeOptions.map((option) => (
          <Link
            key={option.value}
            href={`/gallery?type=${option.value}&style=${currentStyle}`}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              currentType === option.value
                ? 'text-white shadow-[0_2px_8px_rgba(55,101,107,0.25)]'
                : 'hover:-translate-y-px'
            )}
            style={{
              backgroundColor: currentType === option.value ? '#37656b' : '#eeeeee',
              color: currentType === option.value ? '#ffffff' : '#404849',
            }}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* Style tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] mr-1" style={{ color: '#70787a' }}>
          Style
        </span>
        <Link
          href={`/gallery?type=${currentType}&style=all`}
          className={cn(
            'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
            currentStyle === 'all' ? 'text-white shadow-[0_2px_8px_rgba(55,101,107,0.2)]' : 'hover:-translate-y-px'
          )}
          style={{
            backgroundColor: currentStyle === 'all' ? '#37656b' : '#eeeeee',
            color: currentStyle === 'all' ? '#ffffff' : '#404849',
          }}
        >
          All
        </Link>
        {STYLE_OPTIONS.map((style) => (
          <Link
            key={style.id}
            href={`/gallery?type=${currentType}&style=${style.id}`}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              currentStyle === style.id ? 'text-white shadow-[0_2px_8px_rgba(55,101,107,0.2)]' : 'hover:-translate-y-px'
            )}
            style={{
              backgroundColor: currentStyle === style.id ? '#37656b' : '#eeeeee',
              color: currentStyle === style.id ? '#ffffff' : '#404849',
            }}
          >
            {style.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
