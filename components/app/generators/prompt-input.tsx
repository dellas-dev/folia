'use client'

import { useEffect, useState } from 'react'

const promptExamples = [
  'Cute panda holding colorful balloons',
  'Eucalyptus branch with small white roses',
  'Jack-o-lantern with spider web and bats',
  'Watercolor Christmas tree with ornaments',
  'Pink peony with soft green leaves',
  'Baby dinosaur wearing a party hat',
  'Snowflake with holly berries',
  'Hot air balloon floating in clouds',
  'Cute bunny with Easter eggs',
  'Golden wedding rings with flowers',
]

type PromptInputProps = {
  value: string
  onChange: (value: string) => void
}

export function PromptInput({ value, onChange }: PromptInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % promptExamples.length)
    }, 2600)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="element-prompt" className="text-sm font-medium text-foreground">
          Prompt
        </label>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Any language</p>
      </div>
      <textarea
        id="element-prompt"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={promptExamples[placeholderIndex]}
        rows={6}
        className="w-full rounded-[1.4rem] border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15"
      />
      <p className="text-sm text-muted-foreground">
        Write naturally. Gemini will enhance it into a cleaner clipart prompt before generation.
      </p>
    </div>
  )
}
