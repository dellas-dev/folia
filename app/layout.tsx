import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

import { ToastProvider } from '@/components/ui/toast-provider'

import './globals.css'

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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
        </head>
        <body className="antialiased">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
