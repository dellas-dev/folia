'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Download,
  ImagePlus,
  LoaderCircle,
  Lock,
  ScanSearch,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react'

import { useToast } from '@/components/ui/toast-provider'
import { downloadR2File } from '@/lib/download'
import { MOCKUP_BUNDLES, type MockupBundle, type MockupTemplate } from '@/lib/mockup-templates'
import { cn } from '@/lib/utils'
import type { UserTier } from '@/types'

type MockupFormProps = {
  tier: UserTier
  startingCredits: number
  initialInvitationKey?: string
  initialPreviewUrl?: string
}

type MockupMode = 'template' | 'reference' | 'ai'

type AiMockupResponse = {
  generation_id: string
  result: { r2_key: string; signed_url: string }
  credits_remaining: number
}

type DirectMockupResponse = {
  r2_key: string
  signed_url: string
  credits_remaining: number
}

const DEFAULT_BUNDLE = MOCKUP_BUNDLES[0]
const DEFAULT_TEMPLATE = DEFAULT_BUNDLE?.templates[0] ?? null

export function MockupForm({ tier, startingCredits, initialInvitationKey, initialPreviewUrl }: MockupFormProps) {
  const [invitationKey, setInvitationKey] = useState<string | null>(initialInvitationKey ?? null)
  const [invitationName, setInvitationName] = useState<string | null>(initialInvitationKey ? 'From Elements' : null)
  const [invitationPreviewUrl, setInvitationPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
  const [mode, setMode] = useState<MockupMode>('template')
  const [selectedBundleId, setSelectedBundleId] = useState<string>(DEFAULT_BUNDLE?.id ?? '')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(DEFAULT_TEMPLATE?.id ?? null)
  const [customDetails, setCustomDetails] = useState('')
  const [referenceKey, setReferenceKey] = useState<string | null>(null)
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null)
  const [credits, setCredits] = useState(startingCredits)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [referenceUploading, setReferenceUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultR2Key, setResultR2Key] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const canUseMockups = (tier === 'pro' || tier === 'business') && credits > 0
  const selectedBundle = MOCKUP_BUNDLES.find((bundle) => bundle.id === selectedBundleId) ?? DEFAULT_BUNDLE ?? null
  const selectedTemplate =
    selectedBundle?.templates.find((template) => template.id === selectedTemplateId)
    ?? MOCKUP_BUNDLES.flatMap((bundle) => bundle.templates).find((template) => template.id === selectedTemplateId)
    ?? DEFAULT_TEMPLATE

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
              Use curated templates, real reference photos, and premium composition tools to create listing-ready mockups.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <ImagePlus className="size-4" />, title: 'Curated templates', body: 'Measured layouts with stable framing and better control.' },
              { icon: <ScanSearch className="size-4" />, title: 'Reference overlay', body: 'Upload your own styled photo and place the design into it.' },
              { icon: <Sparkles className="size-4" />, title: 'AI fallback', body: 'Keep generative scenes as a beta option, not the default path.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.25rem] p-4 opacity-80" style={{ backgroundColor: '#f4f3f3' }}>
                <div className="flex size-9 items-center justify-center rounded-full" style={{ backgroundColor: '#ffffff', color: '#37656b' }}>
                  {item.icon}
                </div>
                <h3 className="mt-3 text-sm font-bold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{item.title}</h3>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>{item.body}</p>
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

      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json() as { error?: string; r2_key?: string }

      if (!response.ok || !data.r2_key) throw new Error(data.error || 'Reference upload failed.')

      setReferenceKey(data.r2_key)
      setMode('reference')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reference upload failed.')
    } finally {
      setReferenceUploading(false)
    }
  }

  function clearReference() {
    setReferenceKey(null)
    setReferencePreviewUrl(null)
    if (mode === 'reference') setMode('template')
  }

  function selectBundle(bundle: MockupBundle) {
    setSelectedBundleId(bundle.id)

    const activeTemplateStillExists = bundle.templates.some((template) => template.id === selectedTemplateId)
    if (!activeTemplateStillExists) {
      setSelectedTemplateId(bundle.templates[0]?.id ?? null)
    }
  }

  function selectTemplate(bundle: MockupBundle, template: MockupTemplate) {
    setSelectedBundleId(bundle.id)
    setSelectedTemplateId(template.id)
    setMode('template')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!invitationKey) {
        throw new Error('Upload your design first.')
      }

      if (mode === 'reference') {
        if (!referenceKey) throw new Error('Upload a scene reference photo first.')

        const response = await fetch('/api/mockup/overlay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            design_r2_key: invitationKey,
            reference_r2_key: referenceKey,
          }),
        })

        const data = await response.json() as DirectMockupResponse & { error?: string }
        if (!response.ok) throw new Error(data.error || 'Reference mockup failed.')

        setResultUrl(data.signed_url)
        setResultR2Key(data.r2_key)
        setCredits(data.credits_remaining)
        return
      }

      if (mode === 'template') {
        if (!selectedTemplateId) throw new Error('Choose a template first.')

        const response = await fetch('/api/mockup/template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            design_r2_key: invitationKey,
            template_id: selectedTemplateId,
          }),
        })

        const data = await response.json() as DirectMockupResponse & { error?: string }
        if (!response.ok) throw new Error(data.error || 'Template mockup failed.')

        setResultUrl(data.signed_url)
        setResultR2Key(data.r2_key)
        setCredits(data.credits_remaining)
        return
      }

      const response = await fetch('/api/generate/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_r2_key: invitationKey,
          custom_prompt: customDetails.trim() || undefined,
        }),
      })

      const data = await response.json() as AiMockupResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || 'AI mockup generation failed.')

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

  const submitLabel =
    mode === 'reference'
      ? 'Generate From Reference'
      : mode === 'template'
        ? 'Generate With Template'
        : 'Generate AI Mockup'

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

      <div className="grid gap-5 xl:grid-cols-[420px_1fr] xl:items-start">
        <div
          className="rounded-[1.5rem] p-5"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                Generation Approach
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  {
                    id: 'template' as const,
                    icon: <ImagePlus className="size-4" />,
                    label: 'Template',
                    body: 'Use measured mockup templates for stable framing.',
                  },
                  {
                    id: 'reference' as const,
                    icon: <ScanSearch className="size-4" />,
                    label: 'Reference Photo',
                    body: 'Upload your own scene photo and warp the design into it.',
                  },
                  {
                    id: 'ai' as const,
                    icon: <Wand2 className="size-4" />,
                    label: 'AI Scene',
                    body: 'Fallback beta for generated backgrounds and props.',
                  },
                ].map((option) => {
                  const active = option.id === mode
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setMode(option.id)}
                      className={cn(
                        'rounded-[1rem] border p-3 text-left transition-all duration-200',
                        active && 'translate-y-[-1px]'
                      )}
                      style={{
                        borderColor: active ? 'rgba(55,101,107,0.45)' : 'rgba(192,200,201,0.65)',
                        backgroundColor: active ? 'rgba(55,101,107,0.06)' : '#f8f7f6',
                        boxShadow: active ? '0 8px 24px rgba(55,101,107,0.08)' : 'none',
                      }}
                    >
                      <div className="flex size-9 items-center justify-center rounded-full" style={{ backgroundColor: active ? '#37656b' : '#ffffff', color: active ? '#ffffff' : '#37656b' }}>
                        {option.icon}
                      </div>
                      <p className="mt-3 text-sm font-semibold" style={{ color: '#1a1c1c' }}>{option.label}</p>
                      <p className="mt-1 text-[11px] leading-5" style={{ color: '#70787a' }}>{option.body}</p>
                    </button>
                  )
                })}
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
                <p className="text-xs font-medium" style={{ color: '#404849' }}>Click to upload your design</p>
                <p className="text-[10px]" style={{ color: '#c0c8c9' }}>PNG or JPG works best for clean compositing</p>
              </label>
              {invitationPreviewUrl && invitationKey ? (
                <div className="flex items-center gap-3 rounded-[0.875rem] p-3" style={{ backgroundColor: '#d1e3e6' }}>
                  <img src={invitationPreviewUrl} alt="Design preview" className="h-14 w-auto rounded-lg object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold" style={{ color: '#37656b' }}>{invitationName}</p>
                    <p className="mt-0.5 text-[10px]" style={{ color: '#516164' }}>Ready to place into a mockup scene</p>
                  </div>
                </div>
              ) : null}
            </div>

            {mode === 'template' ? (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                      Curated Scene Library
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                      Stable composition
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MOCKUP_BUNDLES.map((bundle) => {
                      const active = bundle.id === selectedBundle?.id
                      return (
                        <button
                          key={bundle.id}
                          type="button"
                          onClick={() => selectBundle(bundle)}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: active ? '#37656b' : '#f4f3f3',
                            color: active ? '#ffffff' : '#404849',
                          }}
                        >
                          <span>{bundle.emoji}</span>
                          {bundle.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedBundle ? (
                  <div className="rounded-[1rem] border p-4" style={{ borderColor: 'rgba(192,200,201,0.65)', backgroundColor: '#faf9f8' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1a1c1c' }}>{selectedBundle.label}</p>
                        <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>{selectedBundle.description}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {selectedBundle.palette.map((color) => (
                          <span
                            key={color}
                            className="size-5 rounded-full border"
                            style={{ backgroundColor: color, borderColor: 'rgba(26,28,28,0.08)' }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {selectedBundle.templates.map((template) => {
                        const active = template.id === selectedTemplate?.id
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => selectTemplate(selectedBundle, template)}
                            className={cn(
                              'overflow-hidden rounded-[1rem] border text-left transition-all duration-200',
                              active && 'translate-y-[-1px]'
                            )}
                            style={{
                              borderColor: active ? 'rgba(55,101,107,0.45)' : 'rgba(192,200,201,0.65)',
                              backgroundColor: '#ffffff',
                              boxShadow: active ? '0 10px 26px rgba(55,101,107,0.1)' : '0 2px 8px rgba(55,101,107,0.04)',
                            }}
                          >
                            <img
                              src={template.thumbUrl}
                              alt={template.angleLabel}
                              className="h-28 w-full object-cover"
                            />
                            <div className="space-y-1 px-3 py-3">
                              <p className="text-sm font-semibold" style={{ color: active ? '#37656b' : '#1a1c1c' }}>
                                {template.angleLabel}
                              </p>
                              <p className="text-[11px]" style={{ color: '#70787a' }}>
                                {template.angleEmoji} measured placement area
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === 'reference' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                    Scene Reference
                  </label>
                  <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                    Required
                  </span>
                </div>
                {referencePreviewUrl ? (
                  <div className="flex items-center gap-3 rounded-[0.875rem] p-3" style={{ backgroundColor: '#f4f3f3' }}>
                    <img src={referencePreviewUrl} alt="Scene reference" className="h-16 w-20 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold" style={{ color: '#404849' }}>Reference uploaded</p>
                      <p className="mt-0.5 text-[10px] leading-4" style={{ color: '#70787a' }}>
                        Folia will detect the printable area and warp your design into this photo.
                      </p>
                    </div>
                    <button type="button" onClick={clearReference} className="shrink-0 rounded-full p-1 transition-colors hover:bg-[#eeeeee]">
                      <X className="size-3.5" style={{ color: '#70787a' }} />
                    </button>
                  </div>
                ) : (
                  <label
                    className={cn('flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] px-5 py-4 text-center transition-all', referenceUploading && 'cursor-wait opacity-60')}
                    style={{ border: '1.5px dashed rgba(192,200,201,0.7)', backgroundColor: '#f4f3f3' }}
                    onMouseEnter={(e) => {
                      if (!referenceUploading) {
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
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={referenceUploading || submitting}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        await uploadReference(file)
                        e.target.value = ''
                      }}
                    />
                    {referenceUploading
                      ? <LoaderCircle className="size-4 animate-spin" style={{ color: '#37656b' }} />
                      : <ScanSearch className="size-4" style={{ color: '#37656b' }} />
                    }
                    <p className="text-xs font-medium" style={{ color: '#404849' }}>Upload your mockup photo</p>
                    <p className="text-[10px]" style={{ color: '#c0c8c9' }}>Best result: clear board, frame, card, or sign surface visible</p>
                  </label>
                )}
                <div className="rounded-[0.875rem] px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(55,101,107,0.07)', color: '#37656b' }}>
                  This mode is for real photos you trust. It preserves your composition better than generating new decorative props.
                </div>
              </div>
            ) : null}

            {mode === 'ai' ? (
              <div className="space-y-2.5">
                <label htmlFor="custom-details" className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  AI Scene Direction
                </label>
                <input
                  id="custom-details"
                  type="text"
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g. refined ivory marble, sparse white ranunculus, luxury editorial light"
                  className="w-full rounded-[0.875rem] px-4 py-3 text-sm outline-none transition-all"
                  style={{ backgroundColor: '#f4f3f3', color: '#1a1c1c', border: '1.5px solid transparent' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(55,101,107,0.4)'
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(55,101,107,0.08)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.backgroundColor = '#f4f3f3'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <div className="rounded-[0.875rem] px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(128,84,59,0.08)', color: '#80543b' }}>
                  AI scene remains a beta fallback. Use templates or reference photos when you need tighter art direction and more professional decorative balance.
                </div>
              </div>
            ) : null}

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
                disabled={!invitationKey || uploading || referenceUploading || submitting}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 16px rgba(55,101,107,0.3)' }}
              >
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {submitting ? 'Folia is building your mockup...' : submitLabel}
              </button>
              {!submitting ? (
                <p className="text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: '#c0c8c9' }}>
                  Uses <strong style={{ color: '#70787a' }}>1</strong> credit
                </p>
              ) : null}
            </div>
          </form>
        </div>

        <div
          className="flex min-h-[460px] flex-col rounded-[1.5rem] p-5"
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
                  style={{ minHeight: '320px' }}
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                Final Mockup
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
          ) : mode === 'template' && selectedTemplate ? (
            <div className="flex h-full flex-col gap-4">
              <div className="overflow-hidden rounded-[1rem] bg-white p-2 shadow-[0_2px_8px_rgba(55,101,107,0.06)]">
                <img
                  src={selectedTemplate.thumbUrl}
                  alt={selectedTemplate.angleLabel}
                  className="h-[320px] w-full rounded-[0.75rem] object-cover"
                />
              </div>
              <div className="rounded-[1rem] bg-white p-4 shadow-[0_2px_8px_rgba(55,101,107,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Selected Template
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
                  {selectedBundle?.label} · {selectedTemplate.angleLabel}
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: '#70787a' }}>
                  This mode uses a measured placement area, so the card sits inside a defined composition instead of floating in an AI-generated scene.
                </p>
              </div>
            </div>
          ) : mode === 'reference' ? (
            <div className="flex flex-1 flex-col gap-4">
              <div
                className="flex flex-1 items-center justify-center overflow-hidden rounded-[1rem] bg-white p-2 shadow-[0_2px_8px_rgba(55,101,107,0.06)]"
                style={{ minHeight: '320px' }}
              >
                {referencePreviewUrl ? (
                  <img
                    src={referencePreviewUrl}
                    alt="Reference scene preview"
                    className="h-full w-full rounded-[0.75rem] object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                      <ScanSearch className="size-6" style={{ color: '#c0c8c9' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                        Reference Photo Preview
                      </p>
                      <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                        Upload a real mockup photo to preview the scene that Folia will use for perspective overlay.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-[1rem] bg-white p-4 shadow-[0_2px_8px_rgba(55,101,107,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
                  Reference Guidance
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: '#70787a' }}>
                  Best input: a clean styled photo where the print area is clearly visible and not blocked by flowers, hands, or heavy shadows.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                <Wand2 className="size-6" style={{ color: '#c0c8c9' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#404849', fontFamily: 'var(--font-heading)' }}>
                  AI Scene Preview
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: '#70787a' }}>
                  AI scene is available as a fallback when you do not have a curated template or your own reference photo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
