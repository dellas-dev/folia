'use client'

import { LoaderCircle, Lock, Upload, X } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ImageUploaderProps = {
  disabled?: boolean
  locked?: boolean
  fileName?: string | null
  onUpload: (file: File) => Promise<void>
  onClear: () => void
  error?: string | null
  isUploading?: boolean
}

export function ImageUploader({
  disabled,
  locked,
  fileName,
  onUpload,
  onClear,
  error,
  isUploading,
}: ImageUploaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="reference-image" className="text-sm font-medium text-foreground">
          Reference image
        </label>
        {locked ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Pro or Business
          </span>
        ) : null}
      </div>

      <label className={cn(
        'flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-border bg-card/60 px-5 py-6 text-center transition-colors',
        (disabled || locked) && 'cursor-not-allowed opacity-70'
      )}>
        <input
          id="reference-image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled || locked || isUploading}
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0]

            if (!file) {
              return
            }

            await onUpload(file)
            event.target.value = ''
          }}
        />

        {isUploading ? <LoaderCircle className="size-6 animate-spin text-primary" /> : <Upload className="size-6 text-primary" />}
        <p className="mt-3 text-sm font-medium text-foreground">
          {locked ? 'Reference uploads unlock on Pro and Business.' : 'Upload clipart to guide Gemini on style and technique.'}
        </p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">PNG, JPEG, or WEBP. Max 10 MB.</p>
      </label>

      {fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm">
          <span className="truncate text-foreground">{fileName}</span>
          <button type="button" onClick={onClear} className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}>
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
