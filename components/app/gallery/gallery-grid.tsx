import { Images } from 'lucide-react'

import type { GalleryItemData } from '@/lib/gallery'
import { GalleryItem } from '@/components/app/gallery/gallery-item'

type GalleryGridProps = {
  items: GalleryItemData[]
  emptyTitle: string
  emptyDescription: string
}

export function GalleryGrid({ items, emptyTitle, emptyDescription }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] p-16 text-center"
        style={{ backgroundColor: '#f4f3f3' }}
      >
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: '#eeeeee' }}
        >
          <Images className="size-6" style={{ color: '#c0c8c9' }} />
        </div>
        <div>
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}
          >
            {emptyTitle}
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-6" style={{ color: '#70787a' }}>
            {emptyDescription}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="columns-2 gap-4 space-y-4 xl:columns-4">
      {items.map((item) => (
        <GalleryItem key={item.id} item={item} />
      ))}
    </div>
  )
}
