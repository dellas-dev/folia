'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CreditCard, LoaderCircle, Lock, Sparkles, Upload } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset, type UserTier } from '@/types'

type MockupFormProps = {
  tier: UserTier
  startingCredits: number
}

type MockupResponse = {
  generation_id: string
  result: {
    r2_key: string
    signed_url: string
  }
  credits_remaining: number
}

export function MockupForm({ tier, startingCredits }: MockupFormProps) {
  const [invitationKey, setInvitationKey] = useState<string | null>(null)
  const [invitationName, setInvitationName] = useState<string | null>(null)
  const [scenePreset, setScenePreset] = useState<MockupScenePreset>('marble-eucalyptus')
  const [customPrompt, setCustomPrompt] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [credits, setCredits] = useState(startingCredits)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canUseMockups = (tier === 'pro' || tier === 'business') && credits > 0

  if (!canUseMockups) {
    return (
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Pro and Business only
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold text-foreground">Mockup Generator is gated behind a paid growth tier.</h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Uploading invitation artwork into styled Etsy-ready scenes is reserved for Pro and Business. Starter users and zero-credit accounts see the upgrade wall here by design.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {MOCKUP_SCENE_OPTIONS.map((scene) => (
              <div key={scene.id} className="rounded-[1.6rem] border border-border/70 bg-background p-4 opacity-80">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl">{scene.emoji}</span>
                  <span className="rounded-full bg-secondary px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {scene.accessLevel === 'all' ? 'Base' : 'Advanced'}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{scene.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{scene.description}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pricing" className={cn(buttonVariants({ size: 'lg' }))}>
              <CreditCard className="size-4" />
              Upgrade to Pro
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    )
  }

  async function uploadInvitation(file: File) {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'invitation')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json() as { error?: string; r2_key?: string }

      if (!response.ok || !data.r2_key) {
        throw new Error(data.error || 'Invitation upload failed.')
      }

      setInvitationKey(data.r2_key)
      setInvitationName(file.name)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Invitation upload failed.')
    } finally {
      setUploading(false)
    }
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
          scene_preset: customPrompt.trim() ? undefined : scenePreset,
          custom_prompt: customPrompt.trim() || undefined,
        }),
      })

      const data = await response.json() as MockupResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Mockup generation failed.')
      }

      setResultUrl(data.result.signed_url)
      setCredits(data.credits_remaining)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Mockup generation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Mockup generator</p>
            <h1 className="mt-2 text-4xl font-semibold text-foreground">Turn invitation artwork into Etsy-ready listing scenes.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Upload your finished invitation, choose a styled preset or write a custom scene, then let Fal Kontext place it into a realistic marketplace mockup.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits left</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{credits}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="invitation-file" className="text-sm font-medium text-foreground">Invitation design</label>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">PNG, JPG, WEBP</p>
          </div>
          <label className={cn('flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-border bg-card/60 px-5 py-6 text-center transition-colors', uploading && 'cursor-wait opacity-70')}>
            <input
              id="invitation-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading || submitting}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                await uploadInvitation(file)
                event.target.value = ''
              }}
            />
            {uploading ? <LoaderCircle className="size-6 animate-spin text-primary" /> : <Upload className="size-6 text-primary" />}
            <p className="mt-3 text-sm font-medium text-foreground">Upload the flat invitation design you want to showcase.</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">One mockup costs 1 credit.</p>
          </label>
          {invitationName ? (
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
              Uploaded: {invitationName}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Scene presets</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">6 curated layouts</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MOCKUP_SCENE_OPTIONS.map((scene) => {
              const active = scene.id === scenePreset

              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setScenePreset(scene.id)}
                  className={cn(
                    'rounded-[1.5rem] border p-4 text-left transition-colors',
                    active ? 'border-primary bg-primary/8' : 'border-border/70 bg-background hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl">{scene.emoji}</span>
                    <span className="rounded-full bg-secondary px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {scene.accessLevel === 'all' ? 'All' : 'Pro+'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{scene.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{scene.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="custom-scene" className="text-sm font-medium text-foreground">Custom scene prompt</label>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overrides preset when filled</p>
          </div>
          <textarea
            id="custom-scene"
            rows={4}
            value={customPrompt}
            onChange={(event) => setCustomPrompt(event.target.value)}
            placeholder="Example: Place the invitation on a soft beige linen table with ribbon, wax seal, and warm afternoon window light."
            className="w-full rounded-[1.4rem] border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15"
          />
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <button type="submit" disabled={!invitationKey || uploading || submitting} className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {submitting ? 'Generating mockup...' : 'Generate mockup'}
        </button>
      </form>

      <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-sm shadow-black/5">
        {resultUrl ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Mockup result</p>
              <h2 className="mt-2 text-3xl font-semibold text-foreground">Your listing image is ready.</h2>
            </div>
            <div className="overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,oklch(0.97_0.01_84),oklch(0.93_0.03_145))] p-4">
              <img src={resultUrl} alt="Generated invitation mockup" className="w-full rounded-[1.2rem] object-cover" />
            </div>
            <a href={resultUrl} download className={cn(buttonVariants({ size: 'lg' }))}>
              Download mockup
            </a>
          </div>
        ) : (
          <div className="flex h-full min-h-[24rem] flex-col justify-center rounded-[1.6rem] border border-dashed border-border/70 bg-background/60 p-8 text-center">
            <h2 className="text-3xl font-semibold text-foreground">Your mockup preview will appear here.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Upload an invitation design, choose a preset or write a custom scene, and Folia will return one polished listing image.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
