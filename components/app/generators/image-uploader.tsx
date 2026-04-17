'use client'

import { useState } from 'react'
import { LoaderCircle, Lock, Upload, X } from 'lucide-react'
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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

        const data = await response.json() as { suggested_prompt?: string; error?: string }

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
        onPromptSuggestionError?.('Could not analyze image. Please describe the style manually.')
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="reference-image"
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: '#70787a' }}
        >
          Reference{' '}
          <span className="font-normal normal-case tracking-normal" style={{ color: '#c0c8c9' }}>
            (Optional)
          </span>
        </label>
        {locked ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: '#eeeeee', color: '#70787a' }}
          >
            <Lock className="size-3" />
            Pro or Business
          </span>
        ) : null}
      </div>

      <label
        className={cn(
          'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-5 text-center transition-all',
          (disabled || locked) && 'cursor-not-allowed opacity-60'
        )}
        style={{
          border: '1.5px dashed rgba(192,200,201,0.7)',
          backgroundColor: '#f4f3f3',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !locked) {
            e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'
            e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.03)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'
          e.currentTarget.style.backgroundColor = '#f4f3f3'
        }}
      >
        <input
          id="reference-image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled || locked || isUploading || isAnalyzing}
          className="sr-only"
          onChange={handleFileChange}
        />

        {isAnalyzing || isUploading ? (
          <>
            <LoaderCircle className="size-5 animate-spin" style={{ color: '#37656b' }} />
            <p className="text-xs font-medium" style={{ color: '#37656b' }}>
              {isAnalyzing ? '✨ Folia is analyzing your reference...' : 'Uploading...'}
            </p>
          </>
        ) : (
          <>
            <Upload className="size-5" style={{ color: locked ? '#c0c8c9' : '#37656b' }} />
            <p className="text-xs font-medium" style={{ color: '#404849' }}>
              {locked
                ? 'Reference uploads unlock on Pro and Business.'
                : 'Drop style reference or click to upload'}
            </p>
          </>
        )}
        <p className="text-[10px]" style={{ color: '#c0c8c9' }}>PNG, JPEG, WEBP · Max 10 MB</p>
      </label>

      {fileName ? (
        <div
          className="flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm"
          style={{ backgroundColor: '#d1e3e6' }}
        >
          <span className="truncate text-xs font-medium" style={{ color: '#37656b' }}>{fileName}</span>
          <button
            type="button"
            onClick={onClear}
            className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/10"
          >
            <X className="size-3.5" style={{ color: '#37656b' }} />
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs" style={{ color: '#ba1a1a' }}>{error}</p>
      ) : null}
    </div>
  )
}
