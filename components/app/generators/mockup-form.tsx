'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Download,
  LoaderCircle,
  Lock,
  ScanSearch,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

import { useToast } from '@/components/ui/toast-provider'
import { downloadR2File } from '@/lib/download'
import { buildMockupRequest, type MockupMode } from '@/lib/mockup/request'
import { MOCKUP_BUNDLES } from '@/lib/mockup-templates'
import { cn } from '@/lib/utils'
import type { UserTier } from '@/types'

type MockupFormProps = {
  tier: UserTier
  startingCredits: number
  initialInvitationKey?: string
  initialPreviewUrl?: string
}

type GenerationResponse = {
  generation_id: string
  result: { r2_key: string; signed_url: string }
  scene_prompt_used: string
  credits_remaining: number
}

type ExtractFormProps = {
  extractKey: string | null
  extractPreviewUrl: string | null
  extractUploading: boolean
  extracting: boolean
  onUpload: (file: File) => Promise<void>
  onClear: () => void
  onExtract: () => Promise<void>
}

type BeforeAfterComparisonProps = {
  beforeUrl: string
  afterUrl: string
  position: number
  onPositionChange: (value: number) => void
}

type MockupTab = 'styled-suites' | 'extract-template'

const ACTIVE_SUITE = MOCKUP_BUNDLES[0] ?? null
const DEFAULT_TEMPLATE_ID = ACTIVE_SUITE?.templates[0]?.id ?? null

function normalizeComparisonPosition(value: number) {
  return Math.max(0, Math.min(100, value))
}

function mapExtractErrorMessage(message: string) {
  if (/detect the main paper or canvas surface|surface edges unclear|corner_detection_failed/i.test(message)) {
    return 'Surface edges unclear. Please ensure the paper is not overlapping with other objects.'
  }

  return message
}

function isExtractResult(r2Key: string | null) {
  return typeof r2Key === 'string' && r2Key.startsWith('extracted/')
}

function BeforeAfterComparison({
  beforeUrl,
  afterUrl,
  position,
  onPositionChange,
}: BeforeAfterComparisonProps) {
  const safePosition = normalizeComparisonPosition(position)

  return (
    <div className="space-y-3">
      <div
        className="relative isolate overflow-hidden rounded-[1rem]"
        style={{ minHeight: '280px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.06)' }}
      >
        <img
          src={beforeUrl}
          alt="Reference before extraction"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - safePosition}% 0 0)` }}
        >
          <img
            src={afterUrl}
            alt="After extraction"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div
          className="absolute inset-y-0 z-10"
          style={{ left: `calc(${safePosition}% - 1px)` }}
        >
          <div className="h-full w-[2px]" style={{ backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 0 0 1px rgba(17,24,39,0.08), 0 0 24px rgba(124,58,237,0.22)' }} />
          <div
            className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderColor: 'rgba(255,255,255,0.85)',
              backgroundColor: 'rgba(255,255,255,0.86)',
              color: '#111827',
              backdropFilter: 'blur(10px)',
            }}
          >
            ↔
          </div>
        </div>

        <div className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: 'rgba(15,23,42,0.58)', color: '#ffffff' }}>
          Before
        </div>
        <div className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: 'rgba(124,58,237,0.88)', color: '#ffffff' }}>
          After
        </div>
      </div>

      <div className="rounded-[0.9rem] px-3 py-3" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.06)' }}>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#6b7280' }}>
          <span>Before/After</span>
          <span>{safePosition}% After</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={safePosition}
          onChange={(e) => onPositionChange(Number(e.target.value))}
          className="comparison-slider h-2 w-full cursor-ew-resize appearance-none rounded-full"
        />
      </div>

      <style jsx>{`
        .comparison-slider {
          background: linear-gradient(90deg, #111827 0%, #7c3aed 100%);
        }

        .comparison-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #7c3aed;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.28);
        }

        .comparison-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #7c3aed;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.28);
        }
      `}</style>
    </div>
  )
}

export function ExtractForm({
  extractKey,
  extractPreviewUrl,
  extractUploading,
  extracting,
  onUpload,
  onClear,
  onExtract,
}: ExtractFormProps) {
  const busy = extractUploading || extracting

  return (
    <div
      className="overflow-hidden rounded-[1.35rem] border p-4"
      style={{
        borderColor: 'rgba(124,58,237,0.14)',
        background: 'linear-gradient(180deg, rgba(248,245,255,0.92) 0%, rgba(255,255,255,0.98) 42%, #ffffff 100%)',
        boxShadow: '0 10px 30px rgba(12,18,28,0.05), inset 0 1px 0 rgba(255,255,255,0.78)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ backgroundColor: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}
          >
            Reference to Canvas
          </span>
          <div>
            <h3
              className="text-[1.15rem] font-semibold"
              style={{ fontFamily: 'var(--font-heading)', color: '#111827', letterSpacing: '-0.03em' }}
            >
              Reference to Canvas
            </h3>
            <p className="mt-2 max-w-sm text-[12px] leading-6" style={{ color: '#5b6475' }}>
              Turn any physical photo into a high-fidelity digital template. Our AI reconstructs original textures for a flawless blank canvas.
            </p>
          </div>
        </div>
        <div className="hidden rounded-[1rem] px-3 py-2 text-right sm:block" style={{ backgroundColor: 'rgba(15,23,42,0.04)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#6b7280' }}>Pipeline</p>
          <p className="mt-1 text-[11px] leading-5" style={{ color: '#374151' }}>Geometry</p>
          <p className="text-[11px] leading-5" style={{ color: '#374151' }}>Texture rebuild</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_168px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#6b7280' }}>
              Source Reference
            </p>
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: '#a1a1aa' }}>
              JPG, PNG, WEBP
            </span>
          </div>

          <label
            className={cn(
              'group flex min-h-[142px] cursor-pointer flex-col justify-between rounded-[1.2rem] border px-4 py-4 transition-all',
              busy && 'cursor-wait opacity-75'
            )}
            style={{
              borderColor: extractPreviewUrl ? 'rgba(124,58,237,0.22)' : 'rgba(148,163,184,0.28)',
              background: extractPreviewUrl
                ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,243,255,0.96) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,247,250,0.96) 100%)',
            }}
          >
            <input
              id="extract-reference-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await onUpload(f); e.target.value = '' }}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div
                  className="flex size-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: extractPreviewUrl ? 'rgba(124,58,237,0.12)' : 'rgba(15,23,42,0.05)' }}
                >
                  {extractUploading
                    ? <LoaderCircle className="size-4 animate-spin" style={{ color: '#7C3AED' }} />
                    : <Upload className="size-4" style={{ color: extractPreviewUrl ? '#7C3AED' : '#111827' }} />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>Source Reference</p>
                  <p className="mt-1 text-[12px] leading-6" style={{ color: '#6b7280' }}>
                    Drop photo from Etsy, Pinterest, or your camera. Best for flat-lays and stationery.
                  </p>
                </div>
              </div>
              {extractPreviewUrl ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-full p-1.5 transition-colors hover:bg-white/70"
                >
                  <X className="size-3.5" style={{ color: '#6b7280' }} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <p className="text-[11px]" style={{ color: extractPreviewUrl ? '#7C3AED' : '#94a3b8' }}>
                {extractPreviewUrl ? 'Reference armed for extraction' : 'Click to browse or drag-and-drop'}
              </p>
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ backgroundColor: 'rgba(15,23,42,0.05)', color: '#475569' }}
              >
                1 credit
              </span>
            </div>
          </label>
        </div>

        <div
          className="relative min-h-[168px] overflow-hidden rounded-[1.2rem] border"
          style={{
            borderColor: 'rgba(148,163,184,0.22)',
            background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          }}
        >
          {extractPreviewUrl ? (
            <>
              <img src={extractPreviewUrl} alt="Source reference preview" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(15,23,42,0.78)] via-[rgba(15,23,42,0.14)] to-transparent px-3 pb-3 pt-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">Reference Preview</p>
                <p className="mt-1 text-[11px] text-white/92">
                  {extractKey ? 'Ready for high-fidelity cleanup' : 'Preparing secure upload'}
                </p>
              </div>
              {extracting ? (
                <>
                  <div className="absolute inset-0 bg-[rgba(17,24,39,0.26)]" />
                  <div className="extract-scan-line absolute inset-x-3 h-10 rounded-full blur-sm" />
                  <div className="absolute left-3 right-3 top-3 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
                    style={{ borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(17,24,39,0.28)', backdropFilter: 'blur(10px)' }}
                  >
                    Analyzing geometry & neutralizing design layers...
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-5 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(124,58,237,0.10)' }}>
                <ScanSearch className="size-5" style={{ color: '#7C3AED' }} />
              </div>
              <p className="mt-3 text-sm font-semibold" style={{ color: '#111827' }}>Blank Canvas Preview</p>
              <p className="mt-1 text-[11px] leading-5" style={{ color: '#6b7280' }}>
                The extracted template will appear here before export.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onExtract}
          disabled={!extractKey || busy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            background: 'linear-gradient(135deg, #111827 0%, #312e81 42%, #7C3AED 100%)',
            boxShadow: '0 12px 30px rgba(124,58,237,0.25)',
          }}
        >
          {extracting ? <LoaderCircle className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
          {extracting
            ? 'Analyzing geometry & neutralizing design layers...'
            : '⚡ Execute Template Extraction'
          }
        </button>
        <p className="text-center text-[11px] leading-5" style={{ color: '#6b7280' }}>
          Premium extract mode isolates the printable surface first, then rebuilds a blank material base for reuse.
        </p>
      </div>

      <style jsx>{`
        .extract-scan-line {
          top: 16px;
          background:
            linear-gradient(180deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.88) 52%, rgba(124,58,237,0) 100%);
          box-shadow: 0 0 28px rgba(124,58,237,0.48);
          animation: extract-scan 2.2s ease-in-out infinite;
        }

        @keyframes extract-scan {
          0% {
            transform: translateY(0);
            opacity: 0.25;
          }
          50% {
            transform: translateY(108px);
            opacity: 0.95;
          }
          100% {
            transform: translateY(0);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  )
}

export function MockupForm({ tier, startingCredits, initialInvitationKey, initialPreviewUrl }: MockupFormProps) {
  const [activeTab, setActiveTab] = useState<MockupTab>('styled-suites')
  const [invitationKey, setInvitationKey] = useState<string | null>(initialInvitationKey ?? null)
  const [invitationName, setInvitationName] = useState<string | null>(initialInvitationKey ? 'From Elements' : null)
  const [invitationPreviewUrl, setInvitationPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(DEFAULT_TEMPLATE_ID)
  const [extractKey, setExtractKey] = useState<string | null>(null)
  const [extractPreviewUrl, setExtractPreviewUrl] = useState<string | null>(null)
  const [extractUploading, setExtractUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [credits, setCredits] = useState(startingCredits)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultR2Key, setResultR2Key] = useState<string | null>(null)
  const [comparisonPosition, setComparisonPosition] = useState(50)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const mode: MockupMode = 'scene-template'
  const canUseMockups = (tier === 'pro' || tier === 'business') && credits > 0
  const isStyledSuitesTab = activeTab === 'styled-suites'
  const isExtractTab = activeTab === 'extract-template'
  const hasLowCredits = credits > 0 && credits <= 5
  const showExtractComparison = !!resultUrl && !!extractPreviewUrl && isExtractResult(resultR2Key)
  const hasExtractResult = showExtractComparison || isExtractResult(resultR2Key)
  const selectedTemplate = MOCKUP_BUNDLES
    .flatMap((bundle) => bundle.templates.map((template) => ({ bundle, template })))
    .find((entry) => entry.template.id === selectedTemplateId)

  /* ── Upgrade wall ─────────────────────────────────────────── */
  if (!canUseMockups) {
    return (
      <div className="pb-8">
        <div className="mb-6 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>Mockup Generator</p>
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}>
            Mockup Generator
          </h1>
        </div>
        <div
          className="rounded-[1.5rem] space-y-6 p-7"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: '#eeeeee', color: '#70787a' }}>
            <Lock className="size-4" />
            Pro and Business only
          </span>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
              Upgrade to unlock Mockup Generator
            </h2>
            <p className="max-w-xl text-sm leading-7" style={{ color: '#70787a' }}>
              Place your clipart into styled lifestyle scenes or extract reusable blank templates from physical references. Available on Pro and Business plans.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(ACTIVE_SUITE?.templates ?? []).map((template) => (
              <div key={template.id} className="rounded-[1.25rem] p-4 opacity-80" style={{ backgroundColor: '#f4f3f3' }}>
                <span className="text-2xl">{template.angleEmoji}</span>
                <h3 className="mt-3 text-sm font-bold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{template.angleLabel}</h3>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>{ACTIVE_SUITE?.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings/billing"
              className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
            >
              <CreditCard className="size-4" />
              Upgrade to Pro
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold transition-colors hover:bg-[#eeeeee]"
              style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Upload handlers ──────────────────────────────────────── */
  async function uploadInvitation(file: File) {
    setUploading(true)
    setError(null)
    setInvitationPreviewUrl(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'invitation')
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json() as { error?: string; r2_key?: string }
      if (!response.ok || !data.r2_key) throw new Error(data.error || 'Upload failed.')
      setInvitationKey(data.r2_key)
      setInvitationName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function uploadExtractReference(file: File) {
    setExtractUploading(true)
    setError(null)
    setExtractPreviewUrl(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'reference')
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json() as { error?: string; r2_key?: string }
      if (!response.ok || !data.r2_key) throw new Error(data.error || 'Upload failed.')
      setExtractKey(data.r2_key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setExtractPreviewUrl(null)
    } finally {
      setExtractUploading(false)
    }
  }

  async function handleExtract() {
    if (!extractKey) return
    setExtracting(true)
    setError(null)
    try {
      const response = await fetch('/api/mockup/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_r2_key: extractKey }),
      })
      const data = await response.json() as GenerationResponse & { error?: string }
      if (!response.ok) throw new Error(mapExtractErrorMessage(data.error || 'Extract failed.'))
      setResultUrl(data.result.signed_url)
      setResultR2Key(data.result.r2_key)
      setCredits(data.credits_remaining)
      setComparisonPosition(50)
      toast({
        title: 'Surface extracted successfully. Lighting and grain preserved.',
        tone: 'success',
      })
    } catch (err) {
      setError(err instanceof Error ? mapExtractErrorMessage(err.message) : 'Extract Template failed.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (!invitationKey) {
        throw new Error('Upload your design first.')
      }

      if (!selectedTemplateId) {
        throw new Error('Choose a scene template first.')
      }

      const requestConfig = buildMockupRequest({
        mode,
        designR2Key: invitationKey,
        templateId: selectedTemplateId,
      })

      const response = await fetch(requestConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestConfig.body),
      })
      const data = await response.json() as GenerationResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Scene Template generation failed.')
      setResultUrl(data.result.signed_url)
      setResultR2Key(data.result.r2_key)
      setCredits(data.credits_remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExport() {
    if (!resultUrl) return
    try {
      setIsExporting(true)
      await downloadR2File(resultR2Key ?? resultUrl, 'folia-mockup.png')
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="pb-8">
      <div className="mb-6 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
          {isExtractTab ? 'Extract Template' : 'Styled Mockup Suites'}
        </p>
        <h1
          className="mt-1 text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
        >
          {isExtractTab ? 'Reference to Canvas' : 'Etsy Invitation Listing Mockups'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: '#70787a' }}>
          {isExtractTab
            ? 'Turn any physical reference photo into a reusable blank template. Folia isolates the printable surface, reconstructs the material base, and preserves the original lighting and grain.'
            : 'Build consistent listing visuals for your Etsy invitation shop. Start with one styled suite, then place your invitation, sign, place card, and table number into matching wedding scenes.'
          }
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('styled-suites')
              setError(null)
            }}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: isStyledSuitesTab ? '#37656b' : 'transparent',
              color: isStyledSuitesTab ? '#ffffff' : '#516164',
            }}
          >
            Styled Mockup Suites
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('extract-template')
              setError(null)
            }}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: isExtractTab ? '#111827' : 'transparent',
              color: isExtractTab ? '#ffffff' : '#516164',
            }}
          >
            Extract Template
          </button>
        </div>
        {isStyledSuitesTab && ACTIVE_SUITE ? (
          <span
            className="inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ backgroundColor: '#f4f3f3', color: '#70787a' }}
          >
            {ACTIVE_SUITE.label}
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr] xl:items-start">
        <div
          className="rounded-[1.5rem] p-5"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
          }}
        >
          {isStyledSuitesTab ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Choose Product Type
                  </p>
                  {selectedTemplate ? (
                    <p className="text-[11px]" style={{ color: '#70787a' }}>
                      {selectedTemplate.bundle.label} / {selectedTemplate.template.angleLabel}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3 rounded-[1rem] p-3" style={{ backgroundColor: '#f4f3f3' }}>
                  {MOCKUP_BUNDLES.map((bundle) => (
                    <div key={bundle.id} className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#1a1c1c' }}>{bundle.emoji} {bundle.label}</p>
                        <p className="text-[11px] leading-5" style={{ color: '#70787a' }}>{bundle.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {bundle.templates.map((template) => {
                          const active = template.id === selectedTemplateId
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              className={cn(
                                'overflow-hidden rounded-[0.875rem] border text-left transition-all',
                                active && 'shadow-[0_0_0_2px_#37656b,0_8px_20px_rgba(55,101,107,0.12)]'
                              )}
                              style={{
                                borderColor: active ? '#37656b' : 'rgba(192,200,201,0.7)',
                                backgroundColor: '#ffffff',
                              }}
                            >
                              <img src={template.thumbUrl} alt={`${bundle.label} ${template.angleLabel}`} className="h-20 w-full object-cover" />
                              <div className="px-2.5 py-2">
                                <p className="text-[11px] font-semibold" style={{ color: active ? '#37656b' : '#1a1c1c' }}>
                                  {template.angleEmoji} {template.angleLabel}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="invitation-file" className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Your Design
                  </label>
                  <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                    JPG, PNG, WEBP
                  </span>
                </div>
                <label
                  className={cn('flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-5 text-center transition-all', uploading && 'cursor-wait opacity-60')}
                  style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                  onMouseEnter={(e) => {
                    if (!uploading) {
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
                    id="invitation-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploading || submitting}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      await uploadInvitation(file)
                      e.target.value = ''
                    }}
                  />
                  {uploading
                    ? <LoaderCircle className="size-5 animate-spin" style={{ color: '#37656b' }} />
                    : <Upload className="size-5" style={{ color: '#37656b' }} />
                  }
                  <p className="text-xs font-medium" style={{ color: '#404849' }}>Click to upload your art</p>
                  <p className="text-[10px]" style={{ color: '#c0c8c9' }}>or drag and drop here</p>
                </label>
                {invitationPreviewUrl && invitationKey ? (
                  <div className="flex items-center gap-3 rounded-[0.875rem] p-3" style={{ backgroundColor: '#d1e3e6' }}>
                    <img src={invitationPreviewUrl} alt="Design preview" className="h-14 w-auto rounded-lg object-contain" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold" style={{ color: '#37656b' }}>{invitationName}</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: '#516164' }}>Ready to use in mockup</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[0.875rem] px-4 py-3 text-xs leading-6" style={{ backgroundColor: 'rgba(55,101,107,0.07)', color: '#37656b' }}>
                Styled Mockup Suites are fixed listing scenes for Etsy invitation sellers. Choose one product type from the Eucalyptus Wedding Suite, upload your artwork, and Folia will place it into the matching template.
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(186,26,26,0.06)', color: '#ba1a1a' }}>
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {hasLowCredits ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}>
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} remaining. <Link href="/settings/billing" className="font-semibold underline underline-offset-2">Top up</Link></p>
                </div>
              ) : null}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={!invitationKey || uploading || submitting}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
                >
                  {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {submitting ? 'Applying styled suite...' : 'Generate Styled Mockup'}
                </button>
                {!submitting ? (
                  <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                    Uses <strong style={{ color: '#70787a' }}>1</strong> credit
                  </p>
                ) : null}
                {!submitting ? (
                  <p className="text-center text-[11px] leading-5" style={{ color: '#70787a' }}>
                    Folia uses a fixed template-warp route so your invitation art stays consistent across matching Etsy listing scenes.
                  </p>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[0.95rem] border px-4 py-3" style={{ borderColor: 'rgba(124,58,237,0.12)', backgroundColor: 'rgba(124,58,237,0.04)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#7C3AED' }}>
                  Private Mockup Library
                </p>
                <p className="mt-2 text-[12px] leading-6" style={{ color: '#5b6475' }}>
                  Upload a physical flat-lay, stationery shot, or Etsy reference, then convert it into a reusable blank surface for your own mockup library.
                </p>
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(186,26,26,0.06)', color: '#ba1a1a' }}>
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {hasLowCredits ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}>
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} remaining. <Link href="/settings/billing" className="font-semibold underline underline-offset-2">Top up</Link></p>
                </div>
              ) : null}

              <ExtractForm
                extractKey={extractKey}
                extractPreviewUrl={extractPreviewUrl}
                extractUploading={extractUploading}
                extracting={extracting}
                onUpload={uploadExtractReference}
                onClear={() => {
                  setExtractKey(null)
                  setExtractPreviewUrl(null)
                }}
                onExtract={handleExtract}
              />
            </div>
          )}
        </div>

        <div
          className="flex min-h-[400px] flex-col rounded-[1.5rem] p-5"
          style={{ backgroundColor: '#f4f3f3' }}
        >
          {resultUrl ? (
            <div className="flex h-full flex-col gap-4">
              {showExtractComparison && extractPreviewUrl ? (
                <BeforeAfterComparison
                  beforeUrl={extractPreviewUrl}
                  afterUrl={resultUrl}
                  position={comparisonPosition}
                  onPositionChange={setComparisonPosition}
                />
              ) : (
                <div
                  className="flex-1 overflow-hidden rounded-[1rem] p-2"
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.06)' }}
                >
                  <img
                    src={resultUrl}
                    alt={hasExtractResult ? 'Extracted blank template' : 'Generated mockup'}
                    className="h-full w-full rounded-[0.75rem] object-cover"
                    style={{ minHeight: '280px' }}
                  />
                </div>
              )}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                {hasExtractResult ? 'Reference Extraction Result' : 'Scene Template Result'}
              </p>
              <div className="mt-auto flex gap-2.5">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
                >
                  {isExporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
                  {isExporting ? 'Exporting...' : 'Export PNG'}
                </button>
                <button
                  type="button"
                  onClick={() => setResultUrl(null)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors hover:bg-[#eeeeee]"
                  style={{ backgroundColor: '#ffffff', color: '#404849' }}
                >
                  <Sparkles className="size-4" />
                  {hasExtractResult ? 'Extract Again' : 'Regenerate'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                <Upload className="size-6" style={{ color: '#c0c8c9' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                  {isExtractTab ? 'Extraction Preview' : 'Mockup Preview'}
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                  {isExtractTab
                    ? 'Upload a source reference to compare the original photo against the cleaned blank canvas here.'
                    : 'Choose a scene and upload your design to see the result here.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
