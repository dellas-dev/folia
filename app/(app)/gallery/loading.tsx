function GalleryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
      <div className="aspect-square animate-pulse bg-[linear-gradient(135deg,oklch(0.94_0.01_84),oklch(0.90_0.02_145))]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-6 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  )
}

export default function GalleryLoading() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-16 w-20 animate-pulse rounded-2xl bg-muted" />
            <div className="h-12 w-32 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3 rounded-[1.8rem] border border-border/70 bg-card/85 p-5 shadow-sm shadow-black/5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-10 w-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <GalleryCardSkeleton key={index} />
        ))}
      </section>
    </div>
  )
}
