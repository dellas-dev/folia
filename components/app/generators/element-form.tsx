'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, LoaderCircle, Sparkles } from 'lucide-react'

import { ImageUploader } from '@/components/app/generators/image-uploader'
import { PromptInput } from '@/components/app/generators/prompt-input'
import { ResultGrid } from '@/components/app/generators/result-grid'
import { StyleSelector } from '@/components/app/generators/style-selector'
import { VariationPicker } from '@/components/app/generators/variation-picker'
import { STYLE_OPTIONS, type GenerationResult, type UserTier } from '@/types'

type ElementFormProps = {
  tier: UserTier
  startingCredits: number
}

type GenerateElementsResponse = {
  generation_id: string
  results: GenerationResult[]
  credits_remaining: number
  prompt_enhanced: string
}

const maxVariationsByTier: Record<UserTier, number> = {
  none: 1,
  starter: 1,
  pro: 4,
  business: 4,
}

export function ElementForm({ tier, startingCredits }: ElementFormProps) {
  const [style, setStyle] = useState(STYLE_OPTIONS[0].id)
  const [prompt, setPrompt] = useState('')
  const [numVariations, setNumVariations] = useState<1 | 2 | 3 | 4>(1)
  const [referenceImageKey, setReferenceImageKey] = useState<string | null>(null)
  const [referenceFileName, setReferenceFileName] = useState<string | null>(null)
  const [suggestedPrompt, setSuggestedPrompt] = useState('')
  const [credits, setCredits] = useState(startingCredits)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [promptEnhanced, setPromptEnhanced] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [promptSuggestionError, setPromptSuggestionError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promptPreviewOpen, setPromptPreviewOpen] = useState(false)

  const maxVariations = maxVariationsByTier[tier]
  const referenceLocked = tier === 'none' || tier === 'starter'

  async function uploadReferenceImage(file: File): Promise<string | null> {
    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'reference')

      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json() as { error?: string; r2_key?: string }

      if (!response.ok || !data.r2_key) throw new Error(data.error || 'Reference upload failed.')

      setReferenceImageKey(data.r2_key)
      setReferenceFileName(file.name)
      return data.r2_key
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Reference upload failed.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/generate/elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style,
          prompt,
          reference_image_r2_key: referenceImageKey ?? undefined,
          num_variations: numVariations,
        }),
      })

      const data = await response.json() as GenerateElementsResponse & { error?: string }

      if (!response.ok) throw new Error(data.error || 'Generation failed.')

      setResults(data.results)
      setPromptEnhanced(data.prompt_enhanced)
      setCredits(data.credits_remaining)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Generation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-8">
      {/* Page heading */}
      <div className="mb-6 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
          Elements Generator
        </p>
        <h1
          className="mt-1 text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
        >
          Generate Clipart
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
        {/* ── Left: Form panel ─────────────────────────────── */}
        <div
          className="rounded-[1.5rem] p-5"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <StyleSelector options={STYLE_OPTIONS} value={style} onChange={setStyle} />
            <PromptInput value={prompt} onChange={setPrompt} suggestedPrompt={suggestedPrompt} />

            {promptSuggestionError ? (
              <p className="text-xs leading-5" style={{ color: '#70787a' }}>
                ℹ️ {promptSuggestionError}
              </p>
            ) : null}

            <ImageUploader
              locked={referenceLocked}
              fileName={referenceFileName}
              onUpload={uploadReferenceImage}
              onPromptSuggested={setSuggestedPrompt}
              onPromptSuggestionError={setPromptSuggestionError}
              onClear={() => {
                setReferenceImageKey(null)
                setReferenceFileName(null)
                setUploadError(null)
                setPromptSuggestionError(null)
                setSuggestedPrompt('')
                setPrompt('')
              }}
              error={uploadError}
              isUploading={isUploading}
              disabled={isSubmitting}
            />

            <VariationPicker value={numVariations} maxVariations={maxVariations} onChange={setNumVariations} />

            {/* Alerts */}
            {formError ? (
              <div
                className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm"
                style={{ backgroundColor: 'rgba(186,26,26,0.06)', color: '#ba1a1a' }}
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{formError}</p>
              </div>
            ) : null}

            {credits > 0 && credits <= 5 ? (
              <div
                className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm"
                style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} remaining.{' '}
                  <Link href="/settings/billing" className="font-semibold underline underline-offset-2">
                    Top up
                  </Link>
                </p>
              </div>
            ) : null}

            {/* Generate button */}
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.35)' }}
            >
              {isSubmitting
                ? <LoaderCircle className="size-4 animate-spin" />
                : <Sparkles className="size-4" />
              }
              {isSubmitting ? 'Folia is generating...' : `Generate ${numVariations} Element${numVariations > 1 ? 's' : ''}`}
            </button>

            {/* Enhanced prompt preview */}
            {promptEnhanced ? (
              <div
                className="overflow-hidden rounded-[0.875rem]"
                style={{ backgroundColor: '#f4f3f3' }}
              >
                <button
                  type="button"
                  onClick={() => setPromptPreviewOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>
                    ✨ Folia-enhanced prompt
                  </span>
                  {promptPreviewOpen
                    ? <ChevronUp className="size-3.5 shrink-0" style={{ color: '#70787a' }} />
                    : <ChevronDown className="size-3.5 shrink-0" style={{ color: '#70787a' }} />
                  }
                </button>
                {promptPreviewOpen ? (
                  <p className="px-4 pb-4 text-[11px] leading-6" style={{ color: '#404849' }}>{promptEnhanced}</p>
                ) : null}
              </div>
            ) : null}
          </form>
        </div>

        {/* ── Right: Results panel ──────────────────────────── */}
        <ResultGrid
          results={results}
          promptEnhanced={promptEnhanced}
          isGenerating={isSubmitting}
          numExpected={numVariations}
        />
      </div>
    </div>
  )
}
