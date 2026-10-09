import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { RegistraSw } from '@/components/AppInstallabile'
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
  description: 'Chi lavora vicino a casa tua a Forlì e Cesena, giudicato solo da chi l’ha davvero chiamato.',
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

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${hanken.variable} ${fraunces.variable}`}>
      <body>
        <RegistraSw />
        <main className="pagina">{children}</main>
      </body>
    </html>
  )
}
