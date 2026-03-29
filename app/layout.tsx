import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant_Garamond, Manrope } from 'next/font/google'

import './globals.css'

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
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
        <body className={`${manrope.variable} ${cormorant.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
