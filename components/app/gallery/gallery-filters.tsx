import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { STYLE_OPTIONS, type IllustrationStyle } from '@/types'

type GalleryFiltersProps = {
  currentType?: 'all' | 'element' | 'mockup'
  currentStyle?: IllustrationStyle | 'all'
}

const typeOptions = [
  { value: 'all', label: 'All' },
  { value: 'element', label: 'Elements' },
  { value: 'mockup', label: 'Mockups' },
] as const

export function GalleryFilters({ currentType = 'all', currentStyle = 'all' }: GalleryFiltersProps) {
  return (
    <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-card/90 p-5 shadow-sm shadow-black/5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Filter by type</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <Link
              key={option.value}
              href={`/gallery?type=${option.value}&style=${currentStyle}`}
              className={cn(buttonVariants({ variant: currentType === option.value ? 'default' : 'outline', size: 'sm' }))}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Filter by style</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/gallery?type=${currentType}&style=all`}
            className={cn(buttonVariants({ variant: currentStyle === 'all' ? 'default' : 'outline', size: 'sm' }))}
          >
            All styles
          </Link>
          {STYLE_OPTIONS.map((style) => (
            <Link
              key={style.id}
              href={`/gallery?type=${currentType}&style=${style.id}`}
              className={cn(buttonVariants({ variant: currentStyle === style.id ? 'default' : 'outline', size: 'sm' }))}
            >
              {style.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
