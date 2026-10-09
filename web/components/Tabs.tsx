'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ICONE: Record<string, string> = {
  casa: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  cerca: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5 12l4 4',
  agenda: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4',
  bacheca: 'M5 4h14v12H9l-4 4z',
  io: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8c1-4 4-6 7-6s6 2 7 6',
}

export function Tabs({ lavoro }: { lavoro: boolean }) {
  const percorso = usePathname()
  const voci = [
    { href: '/', l: 'Home', ic: 'casa' },
    lavoro ? { href: '/lavoro', l: 'Lavoro', ic: 'agenda' } : { href: '/cerca', l: 'Cerca', ic: 'cerca' },
    { href: '/prenotazioni', l: 'Prenotazioni', ic: 'agenda' },
    { href: '/bacheca', l: 'Bacheca', ic: 'bacheca' },
    { href: '/profilo', l: 'Profilo', ic: 'io' },
  ]
  return (
    <nav className="tabs" aria-label="Sezioni">
      {voci.map((v) => {
        const attiva = v.href === '/' ? percorso === '/' : percorso.startsWith(v.href)
        return (
          <Link key={v.href} href={v.href} aria-current={attiva ? 'page' : undefined}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d={ICONE[v.ic]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{v.l}</span>
          </Link>
        )
      })}
    </nav>
  )
}
