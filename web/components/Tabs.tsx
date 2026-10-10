'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icona } from './Icona'
import { useNonLette } from './usaNonLette'

// Barra in basso dell'anteprima: la voce attiva in un riquadro, "Pubblica" in ocra
export function Tabs({ lavoro, utente, nonLette: iniziali }: { lavoro: boolean; utente: string; nonLette: number }) {
  const percorso = usePathname()
  const nonLette = useNonLette(utente, iniziali, 'barra')
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
    // Per chi lavora le prenotazioni sono il lavoro; per chi cerca stanno nel profilo
    if (href === '/lavoro') return percorso.startsWith('/lavoro') || percorso.startsWith('/prenotazioni')
    if (href === '/profilo') return percorso.startsWith('/profilo') || (!lavoro && percorso.startsWith('/prenotazioni')) || percorso === '/notifiche'
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
            <Link key={v.href} href={v.href} aria-current={on ? 'page' : undefined} className="dock-voce">
              <Icona nome={v.ic} lato={21} spessore={on ? 2 : 1.7} />
              <span>{v.l}</span>
              {v.href === '/profilo' && nonLette > 0 && (
                <span className="dock-pallino">
                  <span aria-hidden="true">{nonLette > 9 ? '9+' : nonLette}</span>
                  <span className="nascosto">, {nonLette} notifiche da leggere</span>
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
