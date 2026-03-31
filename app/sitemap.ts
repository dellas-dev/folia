import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const now = new Date()

  return [
    '',
    '/pricing',
    '/community',
    '/sign-in',
    '/sign-up',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }))
}
