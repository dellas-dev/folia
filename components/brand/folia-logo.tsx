import { cn } from '@/lib/utils'

type FoliaLogoProps = {
  className?: string
  imageClassName?: string
  mode?: 'lockup' | 'mark'
  tone?: 'light' | 'dark'
}

const LOGO_SOURCES = {
  mark: '/brand_asset/logo_folia.png',
  lockupLight: '/brand_asset/logo_folia.png',
  lockupDark: '/brand_asset/logo_folia.png',
} as const

export function FoliaLogo({
  className,
  imageClassName,
  mode = 'lockup',
  tone = 'light',
}: FoliaLogoProps) {
  const isMark = mode === 'mark'
  const src = isMark
    ? LOGO_SOURCES.mark
    : tone === 'dark'
      ? LOGO_SOURCES.lockupDark
      : LOGO_SOURCES.lockupLight

  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      <img
        src={src}
        alt={isMark ? 'Folia leaf mark' : 'Folia'}
        className={cn(
          'block h-11 w-auto object-contain select-none',
          isMark && 'size-11',
          imageClassName
        )}
      />
    </span>
  )
}
