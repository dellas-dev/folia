'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Contrast, Download, ImageOff, LoaderCircle, PanelsTopLeft, Scissors } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { downloadR2File } from '@/lib/download'
import type { GenerationResult } from '@/types'

type BgMode = 'white' | 'gray' | 'dark'
const BG_CYCLE: Record<BgMode, BgMode> = { white: 'gray', gray: 'dark', dark: 'white' }
const BG_COLORS: Record<BgMode, string> = { white: '#ffffff', gray: '#e0e0e0', dark: '#1a1c1c' }
const BG_LABELS: Record<BgMode, string> = { white: 'White', gray: 'Gray', dark: 'Dark' }

type ResultCardProps = { result: GenerationResult }

export function ResultCard({ result }: ResultCardProps) {
  const [imgError, setImgError] = useState(false)
  const [bgMode, setBgMode] = useState<BgMode>('white')
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  async function handleDownload() {
    try {
      setIsDownloading(true)
      await downloadR2File(result.r2_key, `folia-clipart-${result.index + 1}.jpg`)
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
    <article
      className="overflow-hidden rounded-[1.25rem]"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 8px 24px rgba(55,101,107,0.06)',
      }}
    >
      {/* Image area */}
      <div
        className="relative aspect-square p-3 transition-colors duration-300"
        style={{ backgroundColor: BG_COLORS[bgMode] }}
      >
        <button
          type="button"
          onClick={() => setBgMode((m) => BG_CYCLE[m])}
          title={`Background: ${BG_LABELS[bgMode]} — click to cycle`}
          className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <Contrast className="size-3" />
          {BG_LABELS[bgMode]}
        </button>

        {imgError ? (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[0.875rem] text-center"
            style={{ border: '1.5px dashed rgba(186,26,26,0.3)', backgroundColor: 'rgba(186,26,26,0.04)' }}
          >
            <ImageOff className="size-7" style={{ color: 'rgba(186,26,26,0.5)' }} />
            <p className="text-xs" style={{ color: 'rgba(186,26,26,0.6)' }}>Image failed to load</p>
          </div>
        ) : (
          <img
            src={result.signed_url}
            alt={`Generated clipart ${result.index + 1}`}
            className="h-full w-full rounded-[0.875rem] object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Info + actions */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}
          >
            Result {result.index + 1}
          </h3>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}
          >
            JPEG
          </span>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
        >
          {isDownloading ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
          {isDownloading ? 'Downloading...' : 'Download JPEG'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/remove-bg?r2_key=${encodeURIComponent(result.r2_key)}`}
            className="flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-[#eeeeee]"
            style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
          >
            <Scissors className="size-3.5" />
            Remove BG
          </Link>
          <Link
            href={`/mockups?r2_key=${encodeURIComponent(result.r2_key)}`}
            className="flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-[#eeeeee]"
            style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
          >
            <PanelsTopLeft className="size-3.5" />
            Mockup
          </Link>
        </div>

        <p className="text-[10px] leading-5" style={{ color: '#c0c8c9' }}>
          White background · Links valid for 7 days
        </p>
      </div>
    </article>
  )
}
