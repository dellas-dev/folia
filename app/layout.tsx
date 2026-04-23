import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Be_Vietnam_Pro, Manrope } from 'next/font/google'

import { ToastProvider } from '@/components/ui/toast-provider'

import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Folia',
  description: 'AI clipart generator for Etsy sellers and digital product creators.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
        </head>
        <body className={`${manrope.variable} ${beVietnamPro.variable} antialiased`}>
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
