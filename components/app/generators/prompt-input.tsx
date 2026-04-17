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
}

export function PromptInput({ value, onChange, suggestedPrompt }: PromptInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [wasAutoFilled, setWasAutoFilled] = useState(false)
  const prevSuggestedRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % promptExamples.length)
    }, 2600)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (suggestedPrompt && suggestedPrompt !== prevSuggestedRef.current && value === '') {
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="element-prompt"
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: '#70787a' }}
        >
          Prompt
        </label>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#c0c8c9' }}>
          Any language
        </span>
      </div>
      <textarea
        id="element-prompt"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={promptExamples[placeholderIndex]}
        rows={5}
        className="w-full rounded-[1rem] px-4 py-3.5 text-sm leading-7 outline-none transition-all"
        style={{
          backgroundColor: '#f4f3f3',
          color: '#1a1c1c',
          resize: 'none',
          border: '1.5px solid transparent',
        }}
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
      {wasAutoFilled ? (
        <p className="text-[11px]" style={{ color: '#37656b' }}>
          ✨ Auto-described from your reference — edit freely
        </p>
      ) : (
        <p className="text-xs leading-5" style={{ color: '#70787a' }}>
          Write naturally. Folia will refine it into a cleaner clipart prompt.
        </p>
      )}
    </div>
  )
}
