'use client'

import { useState } from 'react'
import { LoaderCircle, Lock, Upload, X } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ImageUploaderProps = {
  disabled?: boolean
  locked?: boolean
  fileName?: string | null
  onUpload: (file: File) => Promise<string | null>
  onClear: () => void
  onPromptSuggested?: (prompt: string) => void
  onPromptSuggestionError?: (message: string | null) => void
  error?: string | null
  isUploading?: boolean
}

export function ImageUploader({
  disabled,
  locked,
  fileName,
  onUpload,
  onClear,
  onPromptSuggested,
  onPromptSuggestionError,
  error,
  isUploading,
}: ImageUploaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    const r2Key = await onUpload(file)
    event.target.value = ''

    if (r2Key && onPromptSuggested) {
      setIsAnalyzing(true)
      onPromptSuggestionError?.(null)

      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ r2_key: r2Key }),
        })

        const data = await response.json() as {
          suggested_prompt?: string
          error?: string
        }

        if (response.ok && data.suggested_prompt) {
          onPromptSuggested(data.suggested_prompt)
          onPromptSuggestionError?.(null)
        } else if (!response.ok) {
          const errorMessages: Record<string, string> = {
            quota_exceeded: 'AI analysis unavailable. Please describe the style manually.',
            invalid_key: 'AI analysis unavailable. Please describe the style manually.',
            analysis_failed: 'Could not analyze image. Please describe the style manually.',
          }
          const friendlyMessage = data.error
            ? (errorMessages[data.error] ?? 'Could not analyze image. Please describe the style manually.')
            : 'Could not analyze image. Please describe the style manually.'
          onPromptSuggestionError?.(friendlyMessage)
        }
      } catch {
        onPromptSuggestionError?.(
          'Could not analyze image. Please describe the style manually.'
        )
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
          disabled={disabled || locked || isUploading || isAnalyzing}
          className="sr-only"
          onChange={handleFileChange}
        />

        {isAnalyzing ? (
          <>
            <LoaderCircle className="size-6 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">
              ✨ Folia AI is analyzing your reference...
            </p>
          </>
        ) : isUploading ? (
          <>
            <LoaderCircle className="size-6 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Uploading...
            </p>
          </>
        ) : (
          <>
            <Upload className="size-6 text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {locked
                ? 'Reference uploads unlock on Pro and Business.'
                : 'Upload clipart to guide the style and technique.'}
            </p>
          </>
        )}
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
