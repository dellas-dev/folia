'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Download,
  Frame,
  LoaderCircle,
  Lock,
  ScanSearch,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

import { useToast } from '@/components/ui/toast-provider'
import { downloadR2File } from '@/lib/download'
import { cn } from '@/lib/utils'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset, type UserTier } from '@/types'

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

type OverlayResponse = {
  r2_key: string
  signed_url: string
  credits_remaining: number
}

type Mode = 'ai-scene' | 'photo-overlay'

export function MockupForm({ tier, startingCredits, initialInvitationKey, initialPreviewUrl }: MockupFormProps) {
  const [mode, setMode] = useState<Mode>('ai-scene')

  // ── AI Scene state ────────────────────────────────────────────────
  const [invitationKey, setInvitationKey] = useState<string | null>(initialInvitationKey ?? null)
  const [invitationName, setInvitationName] = useState<string | null>(initialInvitationKey ? 'From Elements' : null)
  const [invitationPreviewUrl, setInvitationPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
  const [scenePreset, setScenePreset] = useState<MockupScenePreset | null>(null)
  const [customDetails, setCustomDetails] = useState('')
  const [_referenceKey, setReferenceKey] = useState<string | null>(null)
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null)
  const [referenceUploading, setReferenceUploading] = useState(false)
  const [analyzingRef, setAnalyzingRef] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Photo Overlay state ───────────────────────────────────────────
  const [overlayDesignKey, setOverlayDesignKey] = useState<string | null>(initialInvitationKey ?? null)
  const [overlayDesignName, setOverlayDesignName] = useState<string | null>(initialInvitationKey ? 'From Elements' : null)
  const [overlayDesignPreview, setOverlayDesignPreview] = useState<string | null>(initialPreviewUrl ?? null)
  const [overlayRefKey, setOverlayRefKey] = useState<string | null>(null)
  const [overlayRefPreview, setOverlayRefPreview] = useState<string | null>(null)
  const [overlayDesignUploading, setOverlayDesignUploading] = useState(false)
  const [overlayRefUploading, setOverlayRefUploading] = useState(false)
  const [overlaySubmitting, setOverlaySubmitting] = useState(false)

  // ── Shared state ──────────────────────────────────────────────────
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultR2Key, setResultR2Key] = useState<string | null>(null)
  const [credits, setCredits] = useState(startingCredits)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const canUseMockups = (tier === 'pro' || tier === 'business') && credits > 0
  const visibleSceneOptions = MOCKUP_SCENE_OPTIONS.slice(0, 3)
  const isAutoMode = scenePreset === null

  /* ── Upgrade wall ────────────────────────────────────────────────── */
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

  /* ── AI Scene: upload handlers ───────────────────────────────────── */
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

  async function handleAiSceneSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  /* ── Photo Overlay: upload handlers ─────────────────────────────── */
  async function uploadOverlayDesign(file: File) {
    setOverlayDesignUploading(true)
    setError(null)
    setOverlayDesignPreview(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'invitation')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json() as { error?: string; r2_key?: string }
      if (!res.ok || !data.r2_key) throw new Error(data.error || 'Upload failed.')
      setOverlayDesignKey(data.r2_key)
      setOverlayDesignName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setOverlayDesignUploading(false)
    }
  }

  async function uploadOverlayRef(file: File) {
    setOverlayRefUploading(true)
    setError(null)
    setOverlayRefPreview(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'reference')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json() as { error?: string; r2_key?: string }
      if (!res.ok || !data.r2_key) throw new Error(data.error || 'Upload failed.')
      setOverlayRefKey(data.r2_key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setOverlayRefUploading(false)
    }
  }

  async function handleOverlaySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOverlaySubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/mockup/overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design_r2_key: overlayDesignKey,
          reference_r2_key: overlayRefKey,
        }),
      })
      const data = await res.json() as OverlayResponse & { error?: string }
      if (!res.ok) throw new Error(data.error || 'Overlay failed.')
      setResultUrl(data.signed_url)
      setResultR2Key(data.r2_key)
      setCredits(data.credits_remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Overlay failed.')
    } finally {
      setOverlaySubmitting(false)
    }
  }

  /* ── Shared: export ──────────────────────────────────────────────── */
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

  const isProcessing = submitting || overlaySubmitting

  return (
    <div className="pb-8">
      {/* Page heading */}
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

      <div className="grid gap-5 xl:grid-cols-[380px_1fr] xl:items-start">

        {/* ── Left: Form ─────────────────────────────────────────── */}
        <div
          className="rounded-[1.5rem] p-5"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
          }}
        >
          {/* Mode switcher */}
          <div
            className="mb-5 flex gap-1 rounded-[0.875rem] p-1"
            style={{ backgroundColor: '#f4f3f3' }}
          >
            <button
              type="button"
              onClick={() => { setMode('ai-scene'); setResultUrl(null); setError(null) }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-[0.625rem] py-2 text-xs font-semibold transition-all',
                mode === 'ai-scene'
                  ? 'text-white shadow-sm'
                  : 'text-[#70787a] hover:text-[#404849]'
              )}
              style={mode === 'ai-scene' ? { background: 'linear-gradient(135deg, #37656b, #507e84)' } : {}}
            >
              <Sparkles className="size-3.5" />
              AI Scene
            </button>
            <button
              type="button"
              onClick={() => { setMode('photo-overlay'); setResultUrl(null); setError(null) }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-[0.625rem] py-2 text-xs font-semibold transition-all',
                mode === 'photo-overlay'
                  ? 'text-white shadow-sm'
                  : 'text-[#70787a] hover:text-[#404849]'
              )}
              style={mode === 'photo-overlay' ? { background: 'linear-gradient(135deg, #37656b, #507e84)' } : {}}
            >
              <Frame className="size-3.5" />
              Photo Overlay
            </button>
          </div>

          {/* ── AI Scene form ─────────────────────────────────────── */}
          {mode === 'ai-scene' ? (
            <form onSubmit={handleAiSceneSubmit} className="space-y-6">
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
              <UploadBox
                label="Your Design"
                hint="JPG, PNG, SVG"
                previewUrl={invitationPreviewUrl}
                previewName={invitationName}
                previewSubtext="Ready to use in mockup"
                uploading={uploading}
                disabled={isProcessing}
                onChange={uploadInvitation}
              />

              {/* Scene reference */}
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
                      disabled={referenceUploading || isProcessing}
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

              {isAutoMode && invitationKey ? (
                <div className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(55,101,107,0.07)', color: '#37656b' }}>
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                  <p>Folia will analyze your design and automatically create a matching realistic scene.</p>
                </div>
              ) : null}

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

              <FormFooter
                error={error}
                credits={credits}
                disabled={!invitationKey || uploading || isProcessing}
                submitting={submitting}
                submitLabel="Generate AI Mockup"
                submittingLabel="Folia is generating your mockup..."
              />
            </form>
          ) : null}

          {/* ── Photo Overlay form ────────────────────────────────── */}
          {mode === 'photo-overlay' ? (
            <form onSubmit={handleOverlaySubmit} className="space-y-6">
              {/* How it works hint */}
              <div
                className="flex items-start gap-3 rounded-[0.875rem] px-4 py-3 text-xs"
                style={{ backgroundColor: 'rgba(55,101,107,0.07)', color: '#37656b' }}
              >
                <Frame className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Upload your design and a real reference photo (an easel, frame, or flat-lay scene).
                  Folia detects the display surface and places your design onto it using perspective warping.
                </p>
              </div>

              {/* Design upload */}
              <UploadBox
                label="Your Design"
                hint="JPG, PNG, SVG"
                previewUrl={overlayDesignPreview}
                previewName={overlayDesignName}
                previewSubtext="Will be placed onto the reference photo"
                uploading={overlayDesignUploading}
                disabled={overlaySubmitting}
                onChange={uploadOverlayDesign}
              />

              {/* Reference photo upload */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Reference Photo
                  </label>
                  <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>Required</span>
                </div>

                {overlayRefPreview ? (
                  <div
                    className="flex items-center gap-3 rounded-[0.875rem] p-3"
                    style={{ backgroundColor: '#f4f3f3' }}
                  >
                    <img src={overlayRefPreview} alt="Reference photo" className="h-14 w-auto rounded-lg object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold" style={{ color: '#404849' }}>Reference photo ready</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: '#70787a' }}>Folia will detect the display surface</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOverlayRefKey(null); setOverlayRefPreview(null) }}
                      className="shrink-0 rounded-full p-1 transition-colors hover:bg-[#eeeeee]"
                      disabled={overlaySubmitting}
                    >
                      <X className="size-3.5" style={{ color: '#70787a' }} />
                    </button>
                  </div>
                ) : (
                  <label
                    className={cn('flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-5 text-center transition-all', overlayRefUploading && 'cursor-wait opacity-60')}
                    style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                    onMouseEnter={(e) => { if (!overlayRefUploading) { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)' } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'; e.currentTarget.style.backgroundColor = '#f4f3f3' }}
                  >
                    <input
                      type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                      disabled={overlayRefUploading || overlaySubmitting}
                      onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadOverlayRef(f); e.target.value = '' }}
                    />
                    {overlayRefUploading
                      ? <LoaderCircle className="size-5 animate-spin" style={{ color: '#37656b' }} />
                      : <Upload className="size-5" style={{ color: '#37656b' }} />
                    }
                    <p className="text-xs font-medium" style={{ color: '#404849' }}>
                      Upload easel / frame / flat-lay photo
                    </p>
                    <p className="text-[10px]" style={{ color: '#c0c8c9' }}>
                      Any photo where a design is displayed on a surface
                    </p>
                  </label>
                )}
              </div>

              <FormFooter
                error={error}
                credits={credits}
                disabled={!overlayDesignKey || !overlayRefKey || overlayDesignUploading || overlayRefUploading || overlaySubmitting}
                submitting={overlaySubmitting}
                submitLabel="Apply Perspective Overlay"
                submittingLabel="Detecting surface & warping..."
              />
            </form>
          ) : null}
        </div>

        {/* ── Right: Preview ──────────────────────────────────────── */}
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
                {mode === 'photo-overlay' ? 'Perspective Overlay Result' : 'AI Scene Result'}
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
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                {mode === 'photo-overlay'
                  ? <Frame className="size-6" style={{ color: '#c0c8c9' }} />
                  : <Upload className="size-6" style={{ color: '#c0c8c9' }} />
                }
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                  {mode === 'photo-overlay' ? 'Overlay Preview' : 'Mockup Preview'}
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                  {mode === 'photo-overlay'
                    ? 'Upload your design and a reference photo to place it with perspective.'
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

/* ── Shared sub-components ─────────────────────────────────────────── */

type UploadBoxProps = {
  label: string
  hint: string
  previewUrl: string | null
  previewName: string | null
  previewSubtext: string
  uploading: boolean
  disabled: boolean
  onChange: (file: File) => Promise<void>
}

function UploadBox({ label, hint, previewUrl, previewName, previewSubtext, uploading, disabled, onChange }: UploadBoxProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>{label}</label>
        <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>{hint}</span>
      </div>
      <label
        className={cn('flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-5 text-center transition-all', uploading && 'cursor-wait opacity-60')}
        style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
        onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)' } }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'; e.currentTarget.style.backgroundColor = '#f4f3f3' }}
      >
        <input
          type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only"
          disabled={uploading || disabled}
          onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await onChange(f); e.target.value = '' }}
        />
        {uploading
          ? <LoaderCircle className="size-5 animate-spin" style={{ color: '#37656b' }} />
          : <Upload className="size-5" style={{ color: '#37656b' }} />
        }
        <p className="text-xs font-medium" style={{ color: '#404849' }}>Click to upload your art</p>
        <p className="text-[10px]" style={{ color: '#c0c8c9' }}>or drag and drop here</p>
      </label>
      {previewUrl && previewName ? (
        <div className="flex items-center gap-3 rounded-[0.875rem] p-3" style={{ backgroundColor: '#d1e3e6' }}>
          <img src={previewUrl} alt="Design preview" className="h-14 w-auto rounded-lg object-contain" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold" style={{ color: '#37656b' }}>{previewName}</p>
            <p className="mt-0.5 text-[10px]" style={{ color: '#516164' }}>{previewSubtext}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type FormFooterProps = {
  error: string | null
  credits: number
  disabled: boolean
  submitting: boolean
  submitLabel: string
  submittingLabel: string
}

function FormFooter({ error, credits, disabled, submitting, submitLabel, submittingLabel }: FormFooterProps) {
  return (
    <>
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
      <div className="space-y-2">
        <button
          type="submit"
          disabled={disabled}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
        >
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {submitting ? submittingLabel : submitLabel}
        </button>
        {!submitting ? (
          <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
            Uses <strong style={{ color: '#70787a' }}>1</strong> credit
          </p>
        ) : null}
      </div>
    </>
  )
}
