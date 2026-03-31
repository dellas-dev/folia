import { cn } from '@/lib/utils'

type FoliaLogoProps = {
  className?: string
  markClassName?: string
  lockupClassName?: string
  showTagline?: boolean
}

export function FoliaLogo({
  className,
  markClassName,
  lockupClassName,
  showTagline = true,
}: FoliaLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <img
        src="/brand_asset/folia-logo-mark.svg"
        alt="Folia leaf mark"
        className={cn('size-11 rounded-2xl', markClassName)}
      />
      <span className={cn('min-w-0', lockupClassName)}>
        <img
          src="/brand_asset/folia-logo-primary.svg"
          alt="Folia"
          className="h-8 w-auto object-contain"
        />
        {showTagline ? (
          <span className="mt-1 block text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            AI clipart generator
          </span>
        ) : null}
      </span>
    </span>
  )
}
