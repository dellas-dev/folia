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
import {
  DEFAULT_MOCKUP_SIGMA,
  parseMockupSigmaInput,
  SHARP_BLUR_SIGMA_MAX,
  SHARP_BLUR_SIGMA_MIN,
} from '@/lib/mockup/sigma'
import { cn } from '@/lib/utils'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset, type UserTier } from '@/types'

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

const DEFAULT_TEMPLATE_ID = MOCKUP_BUNDLES[0]?.templates[0]?.id ?? null

export function MockupForm({ tier, startingCredits, initialInvitationKey, initialPreviewUrl }: MockupFormProps) {
  const [mode, setMode] = useState<MockupMode>('mockup-ai')
  const [invitationKey, setInvitationKey] = useState<string | null>(initialInvitationKey ?? null)
  const [invitationName, setInvitationName] = useState<string | null>(initialInvitationKey ? 'From Elements' : null)
  const [invitationPreviewUrl, setInvitationPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
  const [scenePreset, setScenePreset] = useState<MockupScenePreset | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(DEFAULT_TEMPLATE_ID)
  const [customDetails, setCustomDetails] = useState('')
  const [sigmaInput, setSigmaInput] = useState(String(DEFAULT_MOCKUP_SIGMA))
  const [_referenceKey, setReferenceKey] = useState<string | null>(null)
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null)
  const [referenceUploading, setReferenceUploading] = useState(false)
  const [analyzingRef, setAnalyzingRef] = useState(false)
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
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const canUseMockups = (tier === 'pro' || tier === 'business') && credits > 0
  const isAiMode = mode === 'mockup-ai'
  const isTemplateMode = mode === 'scene-template'
  const isAutoMode = isAiMode && scenePreset === null
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

  function validateSigmaInput() {
    const result = parseMockupSigmaInput(sigmaInput)
    if (!result.ok) {
      setError(result.error)
      return null
    }

    setError(null)

    if (result.value === undefined) {
      setSigmaInput(String(DEFAULT_MOCKUP_SIGMA))
      return DEFAULT_MOCKUP_SIGMA
    }

    return result.value
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
      if (!response.ok) throw new Error(data.error || 'Extract failed.')
      setResultUrl(data.result.signed_url)
      setResultR2Key(data.result.r2_key)
      setCredits(data.credits_remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract Template failed.')
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

      const trimmedPrompt = customDetails.trim() || undefined

      let requestConfig: ReturnType<typeof buildMockupRequest>

      if (isTemplateMode) {
        if (!selectedTemplateId) {
          throw new Error('Choose a scene template first.')
        }

        requestConfig = buildMockupRequest({
          mode: 'scene-template',
          designR2Key: invitationKey,
          templateId: selectedTemplateId,
        })
      } else {
        const sigma = validateSigmaInput()
        if (sigma === null) return

        requestConfig = buildMockupRequest({
          mode: 'mockup-ai',
          designR2Key: invitationKey,
          scenePreset: scenePreset ?? undefined,
          customPrompt: trimmedPrompt,
          sigma,
        })
      }

      const response = await fetch(requestConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestConfig.body),
      })
      const data = await response.json() as GenerationResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || (isTemplateMode ? 'Scene Template generation failed.' : 'Mockup generation failed.'))
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
          Mockup Generator
        </p>
        <h1
          className="mt-1 text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
        >
          Create Mockups
        </h1>
      </div>

      {/* ── Mode toggle ───────────────────────────────────── */}
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => { setMode('mockup-ai'); setResultUrl(null); setError(null) }}
          className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
          style={{
            backgroundColor: isAiMode ? '#37656b' : '#f4f3f3',
            color: isAiMode ? '#ffffff' : '#70787a',
          }}
        >
          Mockup
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('scene-template')
            setSelectedTemplateId((current) => current ?? DEFAULT_TEMPLATE_ID)
            setResultUrl(null)
            setError(null)
          }}
          className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
          style={{
            backgroundColor: isTemplateMode ? '#37656b' : '#f4f3f3',
            color: isTemplateMode ? '#ffffff' : '#70787a',
          }}
        >
          Scene Template
        </button>
      </div>

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

            {isAiMode ? (
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Select Scene
                </p>
                <div className="overflow-x-auto">
                  <div className="flex gap-2.5 pb-1">
                    {MOCKUP_SCENE_OPTIONS.map((scene) => {
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
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Choose Template
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
                      <div className="grid grid-cols-3 gap-2">
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
            )}

            {/* Design upload */}
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
            {isAiMode ? (
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

            {isAiMode ? (
              <div className="space-y-2.5">
                <label htmlFor="mockup-sigma" className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Edge Softness Sigma
                </label>
                <input
                  id="mockup-sigma"
                  type="number"
                  inputMode="decimal"
                  min={SHARP_BLUR_SIGMA_MIN}
                  max={SHARP_BLUR_SIGMA_MAX}
                  step="0.1"
                  value={sigmaInput}
                  onChange={(e) => setSigmaInput(e.target.value)}
                  onBlur={(e) => {
                    const sigma = validateSigmaInput()
                    if (sigma !== null) {
                      setSigmaInput(String(sigma))
                    }
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.backgroundColor = '#f4f3f3'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  className="w-full rounded-[0.875rem] px-4 py-3 text-sm outline-none transition-all"
                  style={{ backgroundColor: '#f4f3f3', color: '#1a1c1c', border: '1.5px solid transparent' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.4)'; e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55,101,107,0.08)' }}
                />
                <p className="text-[11px] leading-5" style={{ color: '#70787a' }}>
                  Controls only the edge feathering, not a blur over the full card. Valid range: {SHARP_BLUR_SIGMA_MIN} to {SHARP_BLUR_SIGMA_MAX}. Default: {DEFAULT_MOCKUP_SIGMA}.
                </p>
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
                {submitting
                  ? (isTemplateMode ? 'Applying template warp...' : 'Folia is generating your mockup...')
                  : (isTemplateMode ? 'Generate Scene Template' : 'Generate Mockup')
                }
              </button>
              {!submitting ? (
                <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                  Uses <strong style={{ color: '#70787a' }}>1</strong> credit
                </p>
              ) : null}
              {isTemplateMode && !submitting ? (
                <p className="text-center text-[11px] leading-5" style={{ color: '#70787a' }}>
                  Template mode memakai route warp terpisah dan langsung menempelkan desain Anda ke template terpilih.
                </p>
              ) : null}
            </div>
          </form>

          {/* ── Extract from Reference (template mode only) ── */}
          {isTemplateMode ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ backgroundColor: '#eeeeee' }} />
                <span className="text-[11px]" style={{ color: '#c0c8c9' }}>atau</span>
                <div className="h-px flex-1" style={{ backgroundColor: '#eeeeee' }} />
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Extract from Reference
                </p>
                <p className="text-[11px] leading-5" style={{ color: '#70787a' }}>
                  Upload foto mockup dari Etsy, Pinterest, atau foto asli.
                  AI akan menghapus desain yang ada dan menggantinya dengan
                  kertas putih kosong siap di-edit di Photoshop.
                </p>

                <label
                  className={cn(
                    'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-4 text-center transition-all',
                    (extractUploading || extracting) && 'cursor-wait opacity-60'
                  )}
                  style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                  onMouseEnter={(e) => { if (!extractUploading && !extracting) { e.currentTarget.style.borderColor = 'rgba(55,101,107,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(55,101,107,0.02)' } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(192,200,201,0.7)'; e.currentTarget.style.backgroundColor = '#f4f3f3' }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={extractUploading || extracting}
                    onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadExtractReference(f); e.target.value = '' }}
                  />
                  {extractUploading
                    ? <LoaderCircle className="size-4 animate-spin" style={{ color: '#37656b' }} />
                    : <Upload className="size-4" style={{ color: '#37656b' }} />
                  }
                  <p className="text-xs font-medium" style={{ color: '#404849' }}>Upload foto mockup referensi</p>
                  <p className="text-[10px]" style={{ color: '#c0c8c9' }}>JPG, PNG, WEBP</p>
                </label>

                {extractPreviewUrl ? (
                  <div className="flex items-center gap-3 rounded-[0.875rem] p-3" style={{ backgroundColor: '#f4f3f3' }}>
                    <img src={extractPreviewUrl} alt="Reference preview" className="h-12 w-auto rounded-lg object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold" style={{ color: '#404849' }}>Foto referensi siap</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: '#70787a' }}>AI akan mendeteksi area kertas otomatis</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setExtractKey(null); setExtractPreviewUrl(null) }}
                      className="shrink-0 rounded-full p-1 transition-colors hover:bg-[#eeeeee]"
                    >
                      <X className="size-3.5" style={{ color: '#70787a' }} />
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={!extractKey || extractUploading || extracting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#f4f3f3', color: '#37656b', border: '1.5px solid rgba(55,101,107,0.3)' }}
                >
                  {extracting
                    ? <><LoaderCircle className="size-4 animate-spin" />AI sedang mendeteksi area kertas...</>
                    : <><ScanSearch className="size-4" />Ekstrak Template dari Referensi</>
                  }
                </button>
                {!extracting ? (
                  <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                    Uses <strong style={{ color: '#70787a' }}>1</strong> credit
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
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
                {isTemplateMode ? 'Scene Template Result' : 'AI Scene Result'}
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
    </div>
  )
}
