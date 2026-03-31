'use client'

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: AnalyticsProperties) => void
    }
  }
}

export function trackClientEvent(eventName: string, properties: AnalyticsProperties = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.posthog?.capture(eventName, properties)

  if (process.env.NODE_ENV !== 'production') {
    console.info('[analytics]', eventName, properties)
  }
}
