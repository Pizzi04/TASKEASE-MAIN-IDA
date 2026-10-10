'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icona } from './Icona'
import { puoTornareIndietro } from './SegnaNavigazione'

// Freccia "indietro" che torna davvero da dove si arriva (cerca, mappa, home, preferiti…).
// Torna indietro solo se c'è una pagina precedente dentro l'app (lo segna SegnaNavigazione),
// altrimenti va alla pagina di ripiego: chi apre un link diretto non esce dall'app.
export function Indietro({ ripiego }: { ripiego: string }) {
  const router = useRouter()
  return (
    <Link
      href={ripiego}
      className="indietro"
      aria-label="Indietro"
      onClick={(e) => {
        if (puoTornareIndietro()) {
          e.preventDefault()
          router.back()
        }
      }}
    >
      <Icona nome="arrowL" lato={20} />
    </Link>
  )
}
