'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Download, ImagePlus, LoaderCircle, Scissors, Upload } from 'lucide-react'

import { useToast } from '@/components/ui/toast-provider'
import { downloadR2File } from '@/lib/download'
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
  | { status: 'selected'; file: File; previewUrl: string }
  | { status: 'uploading'; file: File; previewUrl: string }
  | { status: 'processing'; previewUrl: string }
  | { status: 'done'; originalUrl: string; resultUrl: string; resultR2Key: string }
  | { status: 'error'; previewUrl: string; message: string }

export function RemoveBgForm({ startingCredits, initialR2Key, initialPreviewUrl }: RemoveBgFormProps) {
  const [state, setState] = useState<State>(
    initialR2Key && initialPreviewUrl
      ? { status: 'processing', previewUrl: initialPreviewUrl }
      : { status: 'idle' }
  )
  const [credits, setCredits] = useState(startingCredits)
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!initialR2Key || !initialPreviewUrl) return

    async function autoProcess() {
      try {
        const removeRes = await fetch('/api/remove-bg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ r2_key: initialR2Key }),
        })
        const removeData = await removeRes.json() as { r2_key?: string; signed_url?: string; credits_remaining?: number; error?: string }

        if (!removeRes.ok || !removeData.signed_url) throw new Error(removeData.error || 'Background removal failed.')
        if (typeof removeData.credits_remaining === 'number') setCredits(removeData.credits_remaining)

        setState({ status: 'done', originalUrl: initialPreviewUrl!, resultUrl: removeData.signed_url, resultR2Key: removeData.r2_key ?? '' })
      } catch (error) {
        setState({ status: 'error', previewUrl: initialPreviewUrl!, message: error instanceof Error ? error.message : 'Something went wrong.' })
      }
    }
    void autoProcess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFileSelect(file: File) {
    setState({ status: 'selected', file, previewUrl: URL.createObjectURL(file) })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && /^image\/(png|jpeg|webp)$/.test(file.type)) handleFileSelect(file)
  }

  async function handleProcess() {
    if (state.status !== 'selected') return
    const { file, previewUrl } = state

    setState({ status: 'uploading', file, previewUrl })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'reference')

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json() as { r2_key?: string; error?: string }

      if (!uploadRes.ok || !uploadData.r2_key) throw new Error(uploadData.error || 'Upload failed.')

      setState({ status: 'processing', previewUrl })

      const removeRes = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r2_key: uploadData.r2_key }),
      })
      const removeData = await removeRes.json() as { r2_key?: string; signed_url?: string; credits_remaining?: number; error?: string }

      if (!removeRes.ok || !removeData.signed_url) throw new Error(removeData.error || 'Background removal failed.')
      if (typeof removeData.credits_remaining === 'number') setCredits(removeData.credits_remaining)

      setState({ status: 'done', originalUrl: previewUrl, resultUrl: removeData.signed_url, resultR2Key: removeData.r2_key ?? '' })
    } catch (error) {
      setState({ status: 'error', previewUrl, message: error instanceof Error ? error.message : 'Something went wrong.' })
    }
  }

  function reset() {
    if (state.status === 'done') URL.revokeObjectURL(state.originalUrl)
    else if ('previewUrl' in state) URL.revokeObjectURL((state as { previewUrl: string }).previewUrl)
    setState({ status: 'idle' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isProcessing = state.status === 'uploading' || state.status === 'processing'
  const previewUrl = 'previewUrl' in state ? state.previewUrl : null

  async function handleDownload() {
    if (state.status !== 'done') return

    try {
      setIsDownloading(true)
      await downloadR2File(state.resultR2Key, 'folia-removed-bg.png')
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        tone: 'error',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="pb-8">
      {/* Page heading */}
      <div className="mb-6 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
          Tools
        </p>
        <h1
          className="mt-1 text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
        >
          Remove Background
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr] xl:items-start">

        {/* ── Left: Upload + Controls ───────────────────────── */}
        <div
          className="rounded-[1.5rem] p-5 space-y-5"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
          }}
        >
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => state.status === 'idle' ? fileInputRef.current?.click() : undefined}
            className={cn(
              'relative overflow-hidden rounded-[1.25rem] transition-all',
              state.status === 'idle' && 'cursor-pointer'
            )}
            style={{
              border: '1.5px dashed rgba(192,200,201,0.7)',
              backgroundColor: '#f4f3f3',
              minHeight: '280px',
            }}
            onMouseEnter={(e) => {
              if (state.status === 'idle') {
                e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'
                e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'
              e.currentTarget.style.backgroundColor = '#f4f3f3'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleInputChange}
            />

            {state.status === 'idle' ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-8 text-center">
                <div
                  className="flex size-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#d1e3e6' }}
                >
                  <Upload className="size-6" style={{ color: '#37656b' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1a1c1c' }}>
                    Drop your image here
                  </p>
                  <p className="mt-1 text-xs" style={{ color: '#70787a' }}>
                    Supports PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-1 inline-flex h-9 items-center gap-2 rounded-full px-5 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
                >
                  Select File
                </button>
              </div>
            ) : previewUrl ? (
              <div className="relative min-h-[280px]">
                <img src={previewUrl} alt="Selected image" className="h-full w-full object-contain" style={{ minHeight: '280px' }} />
                {isProcessing ? (
                  <div
                    className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#37656b' }}
                  >
                    <LoaderCircle className="size-4 animate-spin" />
                    {state.status === 'uploading' ? 'Uploading...' : 'Folia is removing the background...'}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Alerts */}
          {state.status === 'error' ? (
            <div
              className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(186,26,26,0.06)', color: '#ba1a1a' }}
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{state.message}</p>
            </div>
          ) : null}

          {credits > 0 && credits <= 5 ? (
            <div
              className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} left.{' '}
                <Link href="/settings/billing" className="font-semibold underline underline-offset-2">Top up</Link>
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="space-y-2.5">
            {state.status !== 'done' ? (
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing || state.status !== 'selected'}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
              >
                {isProcessing ? <LoaderCircle className="size-4 animate-spin" /> : <Scissors className="size-4" />}
                {isProcessing ? 'Folia is processing...' : 'Remove Background'}
              </button>
            ) : null}

            {(state.status === 'selected' || state.status === 'error') ? (
              <button
                type="button"
                onClick={reset}
                disabled={isProcessing}
                className="flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition-colors hover:bg-[#eeeeee]"
                style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
              >
                Choose another image
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Right: Preview + Download ─────────────────────── */}
        <div
          className="flex min-h-[360px] flex-col rounded-[1.5rem] p-5"
          style={{
            backgroundColor: '#f4f3f3',
            boxShadow: '0 2px 8px rgba(55,101,107,0.04)',
          }}
        >
          {state.status === 'done' ? (
            <div className="flex h-full flex-col gap-5">
              {/* Checkered preview */}
              <div
                className="flex-1 overflow-hidden rounded-[1rem] p-3"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(55,101,107,0.06)',
                }}
              >
                <div
                  className="h-full w-full overflow-hidden rounded-[0.75rem]"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
                    backgroundSize: '20px 20px',
                    minHeight: '200px',
                  }}
                >
                  <img
                    src={state.resultUrl}
                    alt="Background removed"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>
                  Preview Background
                </p>
              </div>

              {/* Download */}
              <div className="mt-auto space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
                >
                  {isDownloading ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
                  {isDownloading ? 'Downloading...' : 'Download Result'}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors hover:bg-[#eeeeee]"
                  style={{ backgroundColor: '#ffffff', color: '#404849' }}
                >
                  <ImagePlus className="size-4" />
                  Process another
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-full"
                style={{ backgroundColor: '#eeeeee' }}
              >
                <Scissors className="size-6" style={{ color: '#c0c8c9' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                  Preview Result
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                  Upload an image and click Remove Background to see the transparent PNG here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
