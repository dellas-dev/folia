'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error'

type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

type ToastInput = Omit<ToastItem, 'id'>

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID()
    setItems((current) => [...current, { ...input, id }].slice(-3))
    window.setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6">
        {items.map((item) => {
          const Icon = item.tone === 'success' ? CheckCircle2 : AlertCircle

          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto rounded-[1.5rem] bg-[rgba(251,249,244,0.88)] p-4 shadow-[0_10px_40px_-10px_rgba(27,28,25,0.08)] backdrop-blur-[20px]',
                item.tone === 'success' ? 'text-charcoal' : 'text-charcoal'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', item.tone === 'success' ? 'text-sage-dark' : 'text-destructive')}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm leading-6 text-charcoal/65">{item.description}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 text-charcoal/60 hover:bg-white"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider.')
  }

  return context
}
