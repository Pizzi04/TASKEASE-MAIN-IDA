import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { connection } from 'next/server'
import { RegistraSw } from '@/components/AppInstallabile'
import { DESCRIZIONE, urlSito } from '@/lib/sito'
import './globals.css'
import './prototipo.css'

const hanken = localFont({
  src: './fonts/hankengrotesk-ieVn2YZDLW.woff2',
  weight: '400 800',
  variable: '--font-testo',
})
const spaceMono = localFont({
  src: [
    { path: './fonts/spacemono-400.woff2', weight: '400' },
    { path: './fonts/spacemono-700.woff2', weight: '700' },
  ],
  variable: '--font-numeri',
})
const fraunces = localFont({
  src: './fonts/fraunces-6NUu8FyLNQ.woff2',
  weight: '600',
  variable: '--font-marchio',
})

export const metadata: Metadata = {
  metadataBase: urlSito(),
  title: 'TaskEase',
  description: DESCRIZIONE,
  openGraph: { type: 'website', locale: 'it_IT', siteName: 'TaskEase', title: 'TaskEase', description: DESCRIZIONE },
  twitter: { card: 'summary_large_image', title: 'TaskEase', description: DESCRIZIONE },
  applicationName: 'TaskEase',
  appleWebApp: { capable: true, title: 'TaskEase', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0E1C19',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Ogni pagina è creata al momento: così porta il nonce della CSP (vedi proxy.ts)
  await connection()
  return (
    <html lang="it" className={`${hanken.variable} ${fraunces.variable} ${spaceMono.variable}`}>
      <body>
        <RegistraSw />
        <main className="pagina">{children}</main>
      </body>
    </html>
  )
}
