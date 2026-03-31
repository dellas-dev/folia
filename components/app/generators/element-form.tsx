'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, LoaderCircle, Sparkles, Upload } from 'lucide-react'

import { ImageUploader } from '@/components/app/generators/image-uploader'
import { PromptInput } from '@/components/app/generators/prompt-input'
import { ResultGrid } from '@/components/app/generators/result-grid'
import { StyleSelector } from '@/components/app/generators/style-selector'
import { VariationPicker } from '@/components/app/generators/variation-picker'
import { buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
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
  const { toast } = useToast()
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
  const [refOpen, setRefOpen] = useState(false)

  const maxVariations = maxVariationsByTier[tier]
  const referenceLocked = tier === 'none' || tier === 'starter'

  // Returns r2_key on success, null on failure
  async function uploadReferenceImage(file: File): Promise<string | null> {
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
      return data.r2_key
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reference upload failed.'
      setUploadError(message)
      toast({
        tone: 'error',
        title: 'Reference upload failed',
        description: message,
      })
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
      toast({
        tone: 'success',
        title: 'Generation completed',
        description: `${data.results.length} result${data.results.length > 1 ? 's' : ''} ready in your workspace.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed.'
      setFormError(message)
      toast({
        tone: 'error',
        title: 'Generation failed',
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Element generator</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Generate transparent clipart PNGs.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Pick a style, describe your element, and generate.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Credits left</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{credits}</p>
          </div>
        </div>

        <StyleSelector options={STYLE_OPTIONS} value={style} onChange={setStyle} />
        <PromptInput value={prompt} onChange={setPrompt} suggestedPrompt={suggestedPrompt} />
        <VariationPicker value={numVariations} maxVariations={maxVariations} onChange={setNumVariations} />

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4 text-[#D4A843]" />}
            {isSubmitting ? 'Generating...' : `Generate ${numVariations} result${numVariations > 1 ? 's' : ''}`}
          </button>
          {!isSubmitting ? (
            <p className="text-xs text-muted-foreground">
              Will use{' '}
              <strong className="text-[#D4A843]">
                {numVariations}
              </strong>
              {' '}credit{numVariations > 1 ? 's' : ''}
            </p>
          ) : null}
        </div>

        <div className="space-y-0">
          <button
            type="button"
            onClick={() => setRefOpen((v) => !v)}
            className={cn(
              'flex w-full items-center justify-between',
              'rounded-2xl border border-border/50 px-4 py-3',
              'text-sm transition-colors hover:bg-muted/30',
              refOpen && 'rounded-b-none border-b-0 bg-muted/20'
            )}
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Upload className="size-3.5" />
              <span className="font-medium text-foreground">
                Reference image
              </span>
              <span className="text-xs opacity-60">
                optional · Pro
              </span>
            </span>
            {refOpen
              ? <ChevronUp className="size-3.5 text-muted-foreground" />
              : <ChevronDown className="size-3.5 text-muted-foreground" />
            }
          </button>

          {refOpen && (
            <div className={cn(
              'rounded-b-2xl border border-t-0 border-border/50',
              'space-y-3 bg-card/50 p-4'
            )}>
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
              {promptSuggestionError ? (
                <p className="text-xs text-muted-foreground/70">
                  ℹ️ {promptSuggestionError}
                </p>
              ) : suggestedPrompt ? (
                <p className="text-xs text-muted-foreground/70">
                  ✨ Auto-described from your reference — edit freely
                </p>
              ) : null}
            </div>
          )}
        </div>

        {formError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        {credits > 0 && credits <= 5 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-300">
              Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} remaining.{' '}
              <Link href="/settings/billing" className="underline underline-offset-2">Top up</Link> to keep generating.
            </p>
          </div>
        ) : null}

        {promptEnhanced ? (
          <div className="rounded-2xl border border-border/50 bg-muted/40">
            <button
              type="button"
              onClick={() => setPromptPreviewOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                ✨ Folia AI-enhanced prompt
              </span>
              {promptPreviewOpen
                ? <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
                : <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              }
            </button>
            {promptPreviewOpen ? (
              <p className="px-4 pb-4 text-[11px] leading-6 text-muted-foreground/80">{promptEnhanced}</p>
            ) : null}
          </div>
        ) : null}
      </form>

      <ResultGrid results={results} promptEnhanced={promptEnhanced} isGenerating={isSubmitting} numExpected={numVariations} />
    </div>
  )
}
