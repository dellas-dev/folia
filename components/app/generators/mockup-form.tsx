'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  Grid2x2,
  LoaderCircle,
  Lock,
  ScanSearch,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

import { useToast } from '@/components/ui/toast-provider'
import { downloadR2File } from '@/lib/download'
import { MOCKUP_BUNDLES, type MockupBundle, type MockupTemplate } from '@/lib/mockup-templates'
import { cn } from '@/lib/utils'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset, type UserTier } from '@/types'

// ─── Color matching helpers (client-side, zero API cost) ──────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128]
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

// Samples the image at 40×40 via canvas, returns mean RGB of opaque pixels.
function extractDominantColor(blobUrl: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 40
      canvas.height = 40
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve([128, 128, 128]); return }
      ctx.drawImage(img, 0, 0, 40, 40)
      const { data } = ctx.getImageData(0, 0, 40, 40)
      let r = 0, g = 0, b = 0, n = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++ }
      }
      resolve(n > 0 ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [128, 128, 128])
    }
    img.onerror = () => resolve([128, 128, 128])
    img.src = blobUrl
  })
}

// Returns the bundle id whose palette is closest to the given RGB.
function findClosestBundleId(rgb: [number, number, number]): string {
  let bestId = MOCKUP_BUNDLES[0].id
  let bestDist = Infinity
  for (const bundle of MOCKUP_BUNDLES) {
    for (const hex of bundle.palette) {
      const d = colorDistance(rgb, hexToRgb(hex))
      if (d < bestDist) { bestDist = d; bestId = bundle.id }
    }
  }
  return bestId
}

type MockupFormProps = {
  tier: UserTier
  startingCredits: number
  initialInvitationKey?: string
  initialPreviewUrl?: string
}

type MockupResponse = {
  generation_id: string
  result: { r2_key: string; signed_url: string }
  scene_prompt_used: string
  credits_remaining: number
}

type TemplateResponse = {
  r2_key: string
  signed_url: string
  credits_remaining: number
  template_id: string
}

type ActiveTab = 'ai-scene' | 'templates'

export function MockupForm({ tier, startingCredits, initialInvitationKey, initialPreviewUrl }: MockupFormProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai-scene')

  // Shared design upload state
  const [invitationKey, setInvitationKey] = useState<string | null>(initialInvitationKey ?? null)
  const [invitationName, setInvitationName] = useState<string | null>(initialInvitationKey ? 'From Elements' : null)
  const [invitationPreviewUrl, setInvitationPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
  const [uploading, setUploading] = useState(false)

  // AI Scene tab state
  const [scenePreset, setScenePreset] = useState<MockupScenePreset | null>(null)
  const [customDetails, setCustomDetails] = useState('')
  const [_referenceKey, setReferenceKey] = useState<string | null>(null)
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null)
  const [referenceUploading, setReferenceUploading] = useState(false)
  const [analyzingRef, setAnalyzingRef] = useState(false)

  // Templates tab state
  const [selectedBundle, setSelectedBundle] = useState<MockupBundle | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null)
  const [suggestedBundleId, setSuggestedBundleId] = useState<string | null>(null)
  const [templateSubmitting, setTemplateSubmitting] = useState(false)
  const [templateResultUrl, setTemplateResultUrl] = useState<string | null>(null)
  const [templateResultR2Key, setTemplateResultR2Key] = useState<string | null>(null)
  const [templateExporting, setTemplateExporting] = useState(false)

  // Shared
  const [credits, setCredits] = useState(startingCredits)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultR2Key, setResultR2Key] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const canUseMockups = (tier === 'pro' || tier === 'business') && credits > 0
  const visibleSceneOptions = MOCKUP_SCENE_OPTIONS.slice(0, 3)
  const isAutoMode = scenePreset === null

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
          className="rounded-[1.5rem] p-7 space-y-6"
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
              Place your clipart into styled lifestyle scenes to create Etsy-ready listing images. Available on Pro and Business plans.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {MOCKUP_SCENE_OPTIONS.map((scene) => (
              <div key={scene.id} className="rounded-[1.25rem] p-4 opacity-80" style={{ backgroundColor: '#f4f3f3' }}>
                <span className="text-2xl">{scene.emoji}</span>
                <h3 className="mt-3 text-sm font-bold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{scene.label}</h3>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>{scene.description}</p>
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
    const blobUrl = URL.createObjectURL(file)
    setInvitationPreviewUrl(blobUrl)

    // Analyze dominant color immediately from the blob URL (no API call needed)
    extractDominantColor(blobUrl).then((rgb) => {
      const id = findClosestBundleId(rgb)
      setSuggestedBundleId(id)
    })

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

  async function uploadReference(file: File) {
    setReferenceUploading(true)
    setError(null)
    setReferencePreviewUrl(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'reference')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json() as { error?: string; r2_key?: string }
      if (!uploadRes.ok || !uploadData.r2_key) throw new Error(uploadData.error || 'Upload failed.')
      setReferenceKey(uploadData.r2_key)
      setReferenceUploading(false)
      setAnalyzingRef(true)
      const analyzeRes = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r2_key: uploadData.r2_key }),
      })
      const analyzeData = await analyzeRes.json() as { suggested_prompt?: string; error?: string }
      if (analyzeData.suggested_prompt) {
        setCustomDetails(analyzeData.suggested_prompt)
        setScenePreset(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reference upload failed.')
    } finally {
      setReferenceUploading(false)
      setAnalyzingRef(false)
    }
  }

  function clearReference() {
    setReferenceKey(null)
    setReferencePreviewUrl(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/generate/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_r2_key: invitationKey,
          scene_preset: scenePreset ?? undefined,
          custom_prompt: customDetails.trim() || undefined,
        }),
      })
      const data = await response.json() as MockupResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Mockup generation failed.')
      setResultUrl(data.result.signed_url)
      setResultR2Key(data.result.r2_key)
      setCredits(data.credits_remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mockup generation failed.')
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

  /* ── Template submit ──────────────────────────────────────── */
  async function handleTemplateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!invitationKey || !selectedTemplate) return
    setTemplateSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/mockup/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design_r2_key: invitationKey,
          template_id: selectedTemplate.id,
        }),
      })
      const data = await response.json() as TemplateResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Template mockup failed.')
      setTemplateResultUrl(data.signed_url)
      setTemplateResultR2Key(data.r2_key)
      setCredits(data.credits_remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Template mockup failed.')
    } finally {
      setTemplateSubmitting(false)
    }
  }

  async function handleTemplateExport() {
    if (!templateResultUrl) return
    try {
      setTemplateExporting(true)
      await downloadR2File(templateResultR2Key ?? templateResultUrl, 'folia-template-mockup.png')
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      })
    } finally {
      setTemplateExporting(false)
    }
  }

  return (
    <div className="pb-8">
      <div className="mb-6 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
          Mockup Generator
        </p>
        <h1
          className="mt-1 text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
        >
          Create Mockups
        </h1>
      </div>

      {/* ── Tab switcher ──────────────────────────────────────── */}
      <div className="mb-5 flex gap-1 rounded-[1rem] p-1 w-fit" style={{ backgroundColor: '#eeeeee' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ai-scene')}
          className={cn(
            'flex items-center gap-2 rounded-[0.75rem] px-4 py-2 text-sm font-semibold transition-all duration-200',
            activeTab === 'ai-scene'
              ? 'text-white shadow-sm'
              : 'hover:bg-white/60'
          )}
          style={
            activeTab === 'ai-scene'
              ? { background: 'linear-gradient(135deg, #37656b, #507e84)', color: '#ffffff' }
              : { color: '#70787a' }
          }
        >
          <Sparkles className="size-3.5" />
          AI Scene
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={cn(
            'flex items-center gap-2 rounded-[0.75rem] px-4 py-2 text-sm font-semibold transition-all duration-200',
            activeTab === 'templates'
              ? 'text-white shadow-sm'
              : 'hover:bg-white/60'
          )}
          style={
            activeTab === 'templates'
              ? { background: 'linear-gradient(135deg, #37656b, #507e84)', color: '#ffffff' }
              : { color: '#70787a' }
          }
        >
          <Grid2x2 className="size-3.5" />
          Templates
        </button>
      </div>

      {/* ── Templates tab ─────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr] xl:items-start">
          {/* Left: Template form */}
          <div
            className="rounded-[1.5rem] p-5"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
            }}
          >
            <form onSubmit={handleTemplateSubmit} className="space-y-6">

              {/* Design upload (shared) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="tpl-invitation-file" className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Your Design
                  </label>
                  <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>JPG, PNG, SVG</span>
                </div>
                <label
                  className={cn('flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-5 text-center transition-all', uploading && 'cursor-wait opacity-60')}
                  style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                  onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)' } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'; e.currentTarget.style.backgroundColor = '#f4f3f3' }}
                >
                  <input
                    id="tpl-invitation-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploading || templateSubmitting}
                    onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadInvitation(f); e.target.value = '' }}
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
                      <p className="mt-0.5 text-[10px]" style={{ color: '#516164' }}>Ready to place on template</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Step 1 — Bundle selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Choose Suite
                  </p>
                  {suggestedBundleId ? (
                    <span className="text-[10px] font-semibold" style={{ color: '#37656b' }}>
                      ✦ Color matched
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MOCKUP_BUNDLES.map((bundle) => {
                    const active = selectedBundle?.id === bundle.id
                    const suggested = suggestedBundleId === bundle.id
                    return (
                      <button
                        key={bundle.id}
                        type="button"
                        onClick={() => {
                          setSelectedBundle(bundle)
                          setSelectedTemplate(null)
                        }}
                        className={cn(
                          'relative flex items-start gap-2.5 rounded-[0.875rem] p-3 text-left transition-all duration-200',
                          active
                            ? 'shadow-[0_0_0_2px_#37656b]'
                            : suggested
                              ? 'shadow-[0_0_0_1.5px_rgba(55,101,107,0.4)]'
                              : 'hover:shadow-[0_2px_8px_rgba(55,101,107,0.10)]'
                        )}
                        style={{ backgroundColor: active ? 'rgba(55,101,107,0.07)' : suggested ? 'rgba(55,101,107,0.04)' : '#f4f3f3' }}
                      >
                        {/* Best Match badge */}
                        {suggested && !active ? (
                          <span
                            className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: '#37656b', color: '#ffffff' }}
                          >
                            Best Match
                          </span>
                        ) : null}

                        {/* Palette swatches */}
                        <div className="mt-0.5 flex shrink-0 flex-col gap-0.5">
                          {bundle.palette.map((hex) => (
                            <span
                              key={hex}
                              className="block size-3 rounded-full"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight" style={{ color: active ? '#37656b' : '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
                            {bundle.emoji} {bundle.label}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-4 line-clamp-2" style={{ color: '#70787a' }}>
                            {bundle.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2 — Angle selector (visible only after bundle chosen) */}
              {selectedBundle ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                      Choose Angle
                    </p>
                    <span className="text-[10px]" style={{ color: '#c0c8c9' }}>
                      {selectedBundle.templates.length} options
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBundle.templates.map((tpl) => {
                      const active = selectedTemplate?.id === tpl.id
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tpl)}
                          className={cn(
                            'relative overflow-hidden rounded-[0.875rem] text-left transition-all duration-200',
                            active
                              ? 'shadow-[0_0_0_2px_#37656b,0_4px_12px_rgba(55,101,107,0.18)]'
                              : 'shadow-[0_1px_3px_rgba(55,101,107,0.07)] hover:-translate-y-0.5'
                          )}
                          style={{ backgroundColor: '#ffffff' }}
                        >
                          <div className="relative h-16 overflow-hidden rounded-t-[0.875rem] bg-[#f4f3f3]">
                            <img
                              src={tpl.thumbUrl}
                              alt={tpl.angleLabel}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {active ? (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(55,101,107,0.4)' }}>
                                <CheckCircle2 className="size-5 text-white drop-shadow" />
                              </div>
                            ) : null}
                          </div>
                          <div className="px-1.5 py-1.5 text-center">
                            <p className="text-[10px] font-semibold leading-tight" style={{ color: active ? '#37656b' : '#1a1c1c' }}>
                              {tpl.angleEmoji} {tpl.angleLabel}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Alerts */}
              {error ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(186,26,26,0.06)', color: '#ba1a1a' }}>
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {credits > 0 && credits <= 5 ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}>
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} remaining. <Link href="/settings/billing" className="font-semibold underline underline-offset-2">Top up</Link></p>
                </div>
              ) : null}

              {/* Apply button */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={!invitationKey || !selectedTemplate || uploading || templateSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
                >
                  {templateSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Grid2x2 className="size-4" />}
                  {templateSubmitting ? 'Placing design on template...' : 'Apply to Template'}
                </button>
                {!templateSubmitting ? (
                  <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                    Uses <strong style={{ color: '#70787a' }}>1</strong> credit
                  </p>
                ) : null}
              </div>
            </form>
          </div>

          {/* Right: Template preview */}
          <div
            className="flex min-h-[400px] flex-col rounded-[1.5rem] p-5"
            style={{ backgroundColor: '#f4f3f3' }}
          >
            {templateResultUrl ? (
              <div className="flex h-full flex-col gap-4">
                <div
                  className="flex-1 overflow-hidden rounded-[1rem] p-2"
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.06)' }}
                >
                  <img
                    src={templateResultUrl}
                    alt="Template mockup result"
                    className="h-full w-full rounded-[0.75rem] object-cover"
                    style={{ minHeight: '280px' }}
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  {selectedBundle?.emoji} {selectedBundle?.label} — {selectedTemplate?.angleLabel}
                </p>
                <div className="mt-auto flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleTemplateExport}
                    disabled={templateExporting}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
                  >
                    {templateExporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {templateExporting ? 'Exporting...' : 'Export PNG'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateResultUrl(null)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors hover:bg-[#eeeeee]"
                    style={{ backgroundColor: '#ffffff', color: '#404849' }}
                  >
                    <Grid2x2 className="size-4" />
                    Try Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                {selectedTemplate ? (
                  <>
                    <div className="overflow-hidden rounded-[1rem] shadow-sm" style={{ width: 160 }}>
                      <img src={selectedTemplate.thumbUrl} alt={selectedTemplate.angleLabel} className="h-24 w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                        {selectedBundle?.emoji} {selectedBundle?.label}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: '#70787a' }}>
                        {selectedTemplate.angleEmoji} {selectedTemplate.angleLabel}
                      </p>
                      <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                        {invitationKey ? 'Ready — click Apply to Template.' : 'Upload your design to continue.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex size-14 items-center justify-center rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                      <Grid2x2 className="size-6" style={{ color: '#c0c8c9' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                        Template Preview
                      </p>
                      <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                        Choose a suite, pick an angle, then upload your design.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Scene tab ──────────────────────────────────────── */}
      {activeTab === 'ai-scene' && (
      <div className="grid gap-5 xl:grid-cols-[380px_1fr] xl:items-start">

        {/* ── Left: Form ────────────────────────────────────── */}
        <div
          className="rounded-[1.5rem] p-5"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Scene selector */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                Select Scene
              </p>
              <div className="overflow-x-auto">
                <div className="flex gap-2.5 pb-1">
                  {visibleSceneOptions.map((scene) => {
                    const active = scene.id === scenePreset
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        onClick={() => setScenePreset(scene.id)}
                        className={cn(
                          'group w-[120px] shrink-0 overflow-hidden rounded-[1rem] text-left transition-all duration-200',
                          active
                            ? 'shadow-[0_0_0_2px_#37656b,0_4px_16px_rgba(55,101,107,0.15)]'
                            : 'shadow-[0_2px_8px_rgba(55,101,107,0.06)] hover:-translate-y-0.5'
                        )}
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <div className="flex h-20 items-center justify-center" style={{ backgroundColor: '#f4f3f3' }}>
                          <span className="text-4xl">{scene.emoji}</span>
                        </div>
                        <div className="px-2.5 py-2 text-center">
                          <p className="text-xs font-semibold" style={{ color: active ? '#37656b' : '#1a1c1c' }}>
                            {scene.label}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setScenePreset(null)}
                    className="flex size-10 shrink-0 items-center justify-center self-center rounded-full transition-colors"
                    style={{
                      backgroundColor: isAutoMode ? '#37656b' : '#eeeeee',
                      color: isAutoMode ? '#ffffff' : '#70787a',
                    }}
                    aria-label="Auto scene matching"
                  >
                    <Sparkles className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Design upload */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="invitation-file" className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Your Design
                </label>
                <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                  JPG, PNG, SVG
                </span>
              </div>
              <label
                className={cn('flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-5 text-center transition-all', uploading && 'cursor-wait opacity-60')}
                style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'; e.currentTarget.style.backgroundColor = '#f4f3f3' }}
              >
                <input
                  id="invitation-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={uploading || submitting}
                  onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadInvitation(f); e.target.value = '' }}
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

            {/* Scene reference upload */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Scene Reference
                </label>
                <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>Optional</span>
              </div>
              {referencePreviewUrl ? (
                <div
                  className="flex items-center gap-3 rounded-[0.875rem] p-3"
                  style={{ backgroundColor: analyzingRef ? 'rgba(55,101,107,0.07)' : '#f4f3f3' }}
                >
                  <img src={referencePreviewUrl} alt="Scene reference" className="h-14 w-auto rounded-lg object-contain" />
                  <div className="min-w-0 flex-1">
                    {analyzingRef ? (
                      <div className="flex items-center gap-2">
                        <LoaderCircle className="size-3.5 animate-spin shrink-0" style={{ color: '#37656b' }} />
                        <p className="text-xs font-semibold" style={{ color: '#37656b' }}>Analyzing scene...</p>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold" style={{ color: '#404849' }}>Reference uploaded</p>
                    )}
                    {!analyzingRef && customDetails ? (
                      <p className="mt-0.5 text-[10px] leading-4 line-clamp-2" style={{ color: '#70787a' }}>{customDetails}</p>
                    ) : null}
                  </div>
                  {!analyzingRef ? (
                    <button type="button" onClick={clearReference} className="shrink-0 rounded-full p-1 transition-colors hover:bg-[#eeeeee]">
                      <X className="size-3.5" style={{ color: '#70787a' }} />
                    </button>
                  ) : null}
                </div>
              ) : (
                <label
                  className={cn('flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-4 text-center transition-all', referenceUploading && 'cursor-wait opacity-60')}
                  style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                  onMouseEnter={(e) => { if (!referenceUploading) { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)' } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'; e.currentTarget.style.backgroundColor = '#f4f3f3' }}
                >
                  <input
                    type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                    disabled={referenceUploading || submitting}
                    onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadReference(f); e.target.value = '' }}
                  />
                  {referenceUploading
                    ? <LoaderCircle className="size-4 animate-spin" style={{ color: '#37656b' }} />
                    : <ScanSearch className="size-4" style={{ color: '#c0c8c9' }} />
                  }
                  <p className="text-xs" style={{ color: '#70787a' }}>Upload a photo of the scene you want</p>
                  <p className="text-[10px]" style={{ color: '#c0c8c9' }}>AI will read it and build a matching prompt</p>
                </label>
              )}
            </div>

            {/* Auto mode hint */}
            {isAutoMode && invitationKey ? (
              <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(55,101,107,0.07)', color: '#37656b' }}>
                <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                <p>Folia will analyze your design and automatically create a matching realistic scene.</p>
              </div>
            ) : null}

            {/* Custom details */}
            {isAutoMode ? (
              <div className="space-y-2.5">
                <label htmlFor="custom-details" className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Custom Details{' '}
                  <span className="font-normal normal-case tracking-normal" style={{ color: '#c0c8c9' }}>(optional)</span>
                </label>
                <input
                  id="custom-details"
                  type="text"
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g. candles, outdoor garden, rustic wooden table..."
                  className="w-full rounded-[0.875rem] px-4 py-3 text-sm outline-none transition-all"
                  style={{ backgroundColor: '#f4f3f3', color: '#1a1c1c', border: '1.5px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.4)'; e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55,101,107,0.08)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = '#f4f3f3'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            ) : null}

            {/* Alerts */}
            {error ? (
              <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(186,26,26,0.06)', color: '#ba1a1a' }}>
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            {credits > 0 && credits <= 5 ? (
              <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}>
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>Only <strong>{credits}</strong> credit{credits === 1 ? '' : 's'} remaining. <Link href="/settings/billing" className="font-semibold underline underline-offset-2">Top up</Link></p>
              </div>
            ) : null}

            {/* Generate */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={!invitationKey || uploading || submitting}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
              >
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {submitting ? 'Folia is generating your mockup...' : 'Generate Mockup'}
              </button>
              {!submitting ? (
                <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                  Uses <strong style={{ color: '#70787a' }}>1</strong> credit
                </p>
              ) : null}
            </div>
          </form>
        </div>

        {/* ── Right: Preview ────────────────────────────────── */}
        <div
          className="flex min-h-[400px] flex-col rounded-[1.5rem] p-5"
          style={{ backgroundColor: '#f4f3f3' }}
        >
          {resultUrl ? (
            <div className="flex h-full flex-col gap-4">
              <div
                className="flex-1 overflow-hidden rounded-[1rem] p-2"
                style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.06)' }}
              >
                <img
                  src={resultUrl}
                  alt="Generated mockup"
                  className="h-full w-full rounded-[0.75rem] object-cover"
                  style={{ minHeight: '280px' }}
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                AI Scene Result
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
                  Regenerate
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
                  Mockup Preview
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                  Choose a scene and upload your design to see the result here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
