'use client'

import Link from 'next/link'
import { useNonLette } from './usaNonLette'

// Notifiche non lette, aggiornate in tempo reale.
// Il layout la rimonta (key) quando il conteggio letto dal server cambia, quindi lo stato parte sempre giusto.
export function Campanella({ utente, iniziali }: { utente: string; iniziali: number }) {
  const nonLette = useNonLette(utente, iniziali, 'campanella')

  return (
    <Link href="/notifiche" className="campanella" aria-label={nonLette ? `Notifiche: ${nonLette} da leggere` : 'Notifiche'}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {nonLette > 0 && <span className="pallino">{nonLette > 9 ? '9+' : nonLette}</span>}
    </Link>
  )
}
