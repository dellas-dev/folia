'use client'

import { useState } from 'react'
import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react'

import { ImageUploader } from '@/components/app/generators/image-uploader'
import { PromptInput } from '@/components/app/generators/prompt-input'
import { ResultGrid } from '@/components/app/generators/result-grid'
import { StyleSelector } from '@/components/app/generators/style-selector'
import { VariationPicker } from '@/components/app/generators/variation-picker'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  const [credits, setCredits] = useState(startingCredits)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [promptEnhanced, setPromptEnhanced] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maxVariations = maxVariationsByTier[tier]
  const referenceLocked = tier === 'none' || tier === 'starter'

  async function uploadReferenceImage(file: File) {
    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'reference')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json() as { error?: string; r2_key?: string }

      if (!response.ok || !data.r2_key) {
        throw new Error(data.error || 'Reference upload failed.')
      }

      setReferenceImageKey(data.r2_key)
      setReferenceFileName(file.name)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Reference upload failed.')
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style,
          prompt,
          reference_image_r2_key: referenceImageKey ?? undefined,
          num_variations: numVariations,
        }),
      })

      const data = await response.json() as GenerateElementsResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed.')
      }

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
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Element generator</p>
            <h1 className="mt-2 text-4xl font-semibold text-foreground">Generate transparent clipart PNGs.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Pick a style first, describe the element naturally, then let Gemini refine the prompt before Fal.ai generates the final art.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits left</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{credits}</p>
          </div>
        </div>

        <StyleSelector options={STYLE_OPTIONS} value={style} onChange={setStyle} />
        <PromptInput value={prompt} onChange={setPrompt} />
        <ImageUploader
          locked={referenceLocked}
          fileName={referenceFileName}
          onUpload={uploadReferenceImage}
          onClear={() => {
            setReferenceImageKey(null)
            setReferenceFileName(null)
            setUploadError(null)
          }}
          error={uploadError}
          isUploading={isUploading}
          disabled={isSubmitting}
        />
        <VariationPicker value={numVariations} maxVariations={maxVariations} onChange={setNumVariations} />

        {formError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
        >
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isSubmitting ? 'Generating...' : `Generate ${numVariations} result${numVariations > 1 ? 's' : ''}`}
        </button>
      </form>

      <ResultGrid results={results} promptEnhanced={promptEnhanced} />
    </div>
  )
}
