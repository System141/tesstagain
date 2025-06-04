import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jugiter - NFT Launchpad & Collection Factory',
  description: 'Create, launch, and mint NFT collections with Jugiter. Your next-gen NFT experience starts here.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-slate-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 