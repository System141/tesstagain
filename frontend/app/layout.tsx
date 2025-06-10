import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jugiter - The Ultimate NFT Launchpad',
  description: 'Launch your NFT collection on Ethereum. Create, mint, and manage NFTs with advanced features like allowlists, royalties, and real-time analytics.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-900 text-zinc-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 