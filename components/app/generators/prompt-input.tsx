'use client'

import { useEffect, useRef, useState } from 'react'

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
  suggestedPrompt?: string
  promptHistory?: string[]
  onSelectHistory?: (value: string) => void
}

export function PromptInput({ value, onChange, suggestedPrompt, promptHistory = [], onSelectHistory }: PromptInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [wasAutoFilled, setWasAutoFilled] = useState(false)
  const prevSuggestedRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % promptExamples.length)
    }, 2600)

    return () => window.clearInterval(interval)
  }, [])

  // Auto-fill when suggestedPrompt changes — only if prompt field is currently empty
  useEffect(() => {
    if (
      suggestedPrompt &&
      suggestedPrompt !== prevSuggestedRef.current &&
      value === ''
    ) {
      onChange(suggestedPrompt)
      setWasAutoFilled(true)
    }
    prevSuggestedRef.current = suggestedPrompt
  }, [suggestedPrompt, value, onChange])

  function handleChange(newValue: string) {
    onChange(newValue)

    if (wasAutoFilled && newValue !== suggestedPrompt) {
      setWasAutoFilled(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <label htmlFor="element-prompt" className="text-sm font-medium text-foreground">
          Prompt
        </label>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Any language</p>
      </div>
      <textarea
        autoFocus
        id="element-prompt"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={promptExamples[placeholderIndex]}
        rows={6}
        className="w-full rounded-[1.4rem] border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15"
      />
      {promptHistory.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Recent prompts</p>
          <div className="flex flex-wrap gap-2">
            {promptHistory.map((historyPrompt) => (
              <button
                key={historyPrompt}
                type="button"
                onClick={() => onSelectHistory?.(historyPrompt)}
                className="max-w-full rounded-full border border-border/70 bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={historyPrompt}
              >
                <span className="block max-w-[240px] truncate sm:max-w-[320px]">{historyPrompt}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {wasAutoFilled ? (
        <p className="text-[11px] text-muted-foreground/70">
          ✨ Auto-described from your reference — edit freely
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Write naturally. Folia AI will enhance your prompt before generation.
        </p>
      )}
    </div>
  )
}
