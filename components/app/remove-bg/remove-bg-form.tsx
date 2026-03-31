'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Download, ImagePlus, LoaderCircle, Scissors, Upload } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserTier } from '@/types'

type RemoveBgFormProps = {
  startingCredits: number
  tier: UserTier
  initialR2Key?: string
  initialPreviewUrl?: string
}

type State =
  | { status: 'idle' }
  | { status: 'selected-remote'; previewUrl: string; r2Key: string }
  | { status: 'selected'; file: File; previewUrl: string }
  | { status: 'uploading'; file: File; previewUrl: string }
  | { status: 'processing'; previewUrl: string }
  | { status: 'done'; originalUrl: string; resultUrl: string }
  | { status: 'error'; previewUrl: string; message: string }

export function RemoveBgForm({ startingCredits, initialR2Key, initialPreviewUrl }: RemoveBgFormProps) {
  const [state, setState] = useState<State>(
    initialR2Key && initialPreviewUrl
      ? { status: 'selected-remote', previewUrl: initialPreviewUrl, r2Key: initialR2Key }
      : { status: 'idle' }
  )
  const [credits, setCredits] = useState(startingCredits)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File) {
    const previewUrl = URL.createObjectURL(file)
    setState({ status: 'selected', file, previewUrl })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && /^image\/(png|jpeg|webp)$/.test(file.type)) {
      handleFileSelect(file)
    }
  }

  async function handleProcess() {
    if (state.status !== 'selected' && state.status !== 'selected-remote') return

    const previewUrl = state.previewUrl
    let lastPreviewUrl = previewUrl

    try {
      let r2Key: string

      if (state.status === 'selected') {
        const { file } = state
        setState({ status: 'uploading', file, previewUrl })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('purpose', 'reference')

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json() as { r2_key?: string; error?: string }

        if (!uploadRes.ok || !uploadData.r2_key) {
          throw new Error(uploadData.error || 'Upload failed.')
        }

        r2Key = uploadData.r2_key
      } else {
        setState({ status: 'processing', previewUrl })
        r2Key = state.r2Key
      }

      const removeRes = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r2_key: r2Key }),
      })

      const removeData = await removeRes.json() as { signed_url?: string; credits_remaining?: number; error?: string }

      if (!removeRes.ok || !removeData.signed_url) {
        throw new Error(removeData.error || 'Background removal failed.')
      }

      if (typeof removeData.credits_remaining === 'number') {
        setCredits(removeData.credits_remaining)
      }

      setState({ status: 'done', originalUrl: previewUrl, resultUrl: removeData.signed_url })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      setState({ status: 'error', previewUrl: lastPreviewUrl, message })
    }
  }

  function reset() {
    if (state.status === 'done') {
      revokeBlobUrl(state.originalUrl)
    } else if (state.status === 'selected' || state.status === 'uploading') {
      revokeBlobUrl(state.previewUrl)
    }

    setState({ status: 'idle' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isProcessing = state.status === 'uploading' || state.status === 'processing'
  const showPreviewPanel = state.status === 'selected' || state.status === 'selected-remote' || isProcessing || state.status === 'error'

  return (
    <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Remove Background</p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground">Remove background from any image.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Upload a JPEG or PNG — AI removes the background and returns a transparent PNG. 1 credit per image.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits left</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{credits}</p>
        </div>
      </div>

      {state.status === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-[1.6rem] border-2 border-dashed border-border bg-card/60 px-8 py-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleInputChange}
          />
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="size-7 text-primary" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">Drop an image here or click to browse</p>
            <p className="mt-1.5 text-sm text-muted-foreground">PNG, JPEG, or WEBP · Max 10 MB</p>
          </div>
        </div>
      )}

      {showPreviewPanel && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-white">
            <div className="aspect-square max-h-80 w-full">
              <img
                src={(state as { previewUrl: string }).previewUrl}
                alt="Selected image"
                className="h-full w-full object-contain"
              />
            </div>
            {isProcessing && (
              <div className="flex items-center justify-center gap-3 border-t border-border/50 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                <span>{state.status === 'uploading' ? 'Uploading...' : 'Removing background...'}</span>
              </div>
            )}
          </div>

          {state.status === 'error' && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{state.message}</p>
            </div>
          )}

          {state.status === 'selected-remote' ? (
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
              Confirm background removal to spend <strong className="text-foreground">1 credit</strong> on this existing image.
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

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing || (state.status !== 'selected' && state.status !== 'selected-remote')}
              className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
            >
              {isProcessing
                ? <LoaderCircle className="size-4 animate-spin" />
                : <Scissors className="size-4" />}
              {isProcessing ? 'Processing...' : 'Remove Background'}
            </button>
            {!isProcessing && (state.status === 'selected' || state.status === 'selected-remote') ? (
              <p className="text-xs text-muted-foreground">Will use <strong>1</strong> credit</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={isProcessing}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full sm:w-auto')}
          >
            Choose another image
          </button>
        </div>
      )}

      {state.status === 'done' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[1.6rem] border border-border/70">
              <div className="bg-white px-4 pt-4">
                <div className="aspect-square overflow-hidden rounded-[1.1rem]">
                  <img src={state.originalUrl} alt="Original" className="h-full w-full object-contain" />
                </div>
              </div>
              <div className="px-4 pb-4 pt-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Original</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.6rem] border border-primary/30 bg-card shadow-sm shadow-primary/10">
              <div className="px-4 pt-4">
                <div
                  className="aspect-square overflow-hidden rounded-[1.1rem]"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <img src={state.resultUrl} alt="Background removed" className="h-full w-full object-contain" />
                </div>
              </div>
              <div className="space-y-3 px-4 pb-4 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Transparent PNG</p>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">PNG</span>
                </div>
                <a
                  href={state.resultUrl}
                  download="folia-removed-bg.png"
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
                >
                  <Download className="size-4" />
                  Download PNG
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}
          >
            <ImagePlus className="size-4" />
            Process another image
          </button>
        </div>
      )}
    </div>
  )
}

function revokeBlobUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
