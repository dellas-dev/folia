function GalleryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.8rem] bg-white shadow-[0_10px_40px_-10px_rgba(27,28,25,0.06)]">
      <div className="aspect-square animate-pulse bg-[#f0ede7]" />
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
      <section className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,243,238,0.92))] p-8 shadow-[0_10px_40px_-10px_rgba(27,28,25,0.06)]">
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

      <section className="flex flex-wrap gap-3 rounded-[2rem] bg-[#f5f3ee] p-5 shadow-[0_10px_40px_-10px_rgba(27,28,25,0.06)]">
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
