function PanelSkeleton() {
  return (
    <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-14 w-24 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-[1.4rem] bg-muted" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-[1.4rem] bg-muted" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-[1.2rem] bg-muted" />
        ))}
      </div>

      <div className="flex gap-3">
        <div className="h-12 w-44 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 w-24 animate-pulse rounded-2xl bg-muted" />
      </div>

      <div className="h-16 animate-pulse rounded-[1.4rem] bg-muted" />
    </div>
  )
}

function ResultCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
      <div className="aspect-square animate-pulse bg-[linear-gradient(135deg,oklch(0.94_0.01_84),oklch(0.90_0.02_145))]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  )
}

export default function ElementsLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <PanelSkeleton />
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-[1.8rem] bg-muted" />
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <ResultCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
