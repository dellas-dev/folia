type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

export async function trackServerEvent(eventName: string, properties: AnalyticsProperties = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[analytics]', eventName, properties)
  }
}
