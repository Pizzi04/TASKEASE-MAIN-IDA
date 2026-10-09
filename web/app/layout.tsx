import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const hanken = localFont({
  src: './fonts/hankengrotesk-ieVn2YZDLW.woff2',
  weight: '400 800',
  variable: '--font-testo',
})
const fraunces = localFont({
  src: './fonts/fraunces-6NUu8FyLNQ.woff2',
  weight: '600',
  variable: '--font-marchio',
})

export const metadata: Metadata = {
  title: 'TaskEase',
  description: 'Servizi in zona a Forlì e Cesena, con la reputazione IDA.',
}

export const viewport: Viewport = {
  themeColor: '#0E1C19',
  width: 'device-width',
  initialScale: 1,
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${hanken.variable} ${fraunces.variable}`}>
      <body>
        <main className="pagina">{children}</main>
      </body>
    </html>
  )
}
