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
      <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/70 p-10 text-center">
        <h2 className="text-3xl font-semibold text-foreground">{emptyTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{emptyDescription}</p>
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
