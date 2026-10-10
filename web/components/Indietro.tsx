'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icona } from './Icona'

// Freccia "indietro" che torna davvero da dove si arriva (cerca, mappa, home, preferiti…).
// Se si è entrati da un link esterno torna alla pagina di ripiego.
export function Indietro({ ripiego }: { ripiego: string }) {
  const router = useRouter()
  return (
    <Link
      href={ripiego}
      className="indietro"
      aria-label="Indietro"
      onClick={(e) => {
        const daQui = document.referrer && new URL(document.referrer).origin === location.origin
        if (daQui && history.length > 1) {
          e.preventDefault()
          router.back()
        }
      }}
    >
      <Icona nome="arrowL" lato={20} />
    </Link>
  )
}
