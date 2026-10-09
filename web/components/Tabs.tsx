'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icona } from './Icona'

// Barra in basso dell'anteprima: la voce attiva in un riquadro, "Pubblica" in ocra
export function Tabs({ lavoro }: { lavoro: boolean }) {
  const percorso = usePathname()
  const voci = lavoro
    ? [
        { href: '/', l: 'Home', ic: 'home' },
        { href: '/lavoro', l: 'Lavoro', ic: 'cal' },
        { href: '/bacheca', l: 'Bacheca', ic: 'grid' },
        { href: '/profilo', l: 'Profilo', ic: 'user' },
      ]
    : [
        { href: '/', l: 'Home', ic: 'home' },
        { href: '/cerca', l: 'Cerca', ic: 'search' },
        { href: '/bacheca/nuova', l: 'Pubblica', ic: 'plus', piu: true },
        { href: '/bacheca', l: 'Bacheca', ic: 'grid' },
        { href: '/profilo', l: 'Profilo', ic: 'user' },
      ]
  const attiva = (href: string) => {
    if (href === '/') return percorso === '/'
    if (href === '/bacheca') return percorso.startsWith('/bacheca') && percorso !== '/bacheca/nuova'
    if (href === '/profilo') return percorso.startsWith('/profilo') || percorso.startsWith('/prenotazioni') || percorso === '/notifiche'
    return percorso.startsWith(href)
  }
  return (
    <nav className="dock" aria-label="Sezioni">
      <div className="dock-voci">
        {voci.map((v) => {
          const on = attiva(v.href)
          return v.piu ? (
            <Link key={v.href} href={v.href} className="dock-piu" aria-current={on ? 'page' : undefined}>
              <span className="dock-piu-i">
                <Icona nome="plus" lato={16} spessore={2.4} />
              </span>
              <span>{v.l}</span>
            </Link>
          ) : (
            <Link key={v.href} href={v.href} aria-current={on ? 'page' : undefined}>
              <Icona nome={v.ic} lato={21} spessore={on ? 2 : 1.7} />
              <span>{v.l}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
