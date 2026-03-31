import Link from 'next/link'
import { Leaf } from 'lucide-react'

import type { GalleryItemData } from '@/lib/gallery'

import { GalleryItem } from '@/components/app/gallery/gallery-item'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type GalleryGridProps = {
  items: GalleryItemData[]
  isFiltered?: boolean
}

export function GalleryGrid({ items, isFiltered = false }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/70 p-10 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#F1EFE8]">
            <Leaf className="size-8 text-[#5C9060]" />
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-foreground">
            {isFiltered ? 'No generations match these filters.' : 'No generations yet.'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {isFiltered
              ? 'Try a different type or style filter, or clear the filters to see all of your saved work.'
              : 'Start by generating your first clipart element or mockup. Your saved results will appear here automatically.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {isFiltered ? (
              <Link href="/gallery" className={cn(buttonVariants({ size: 'lg' }))}>
                Clear filters
              </Link>
            ) : (
              <Link href="/elements" className={cn(buttonVariants({ size: 'lg' }))}>
                Generate element
              </Link>
            )}
            <Link href="/mockups" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Open mockups
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-5 space-y-5 lg:columns-2 2xl:columns-3">
      {items.map((item) => (
        <GalleryItem key={item.id} item={item} />
      ))}
    </div>
  )
}
