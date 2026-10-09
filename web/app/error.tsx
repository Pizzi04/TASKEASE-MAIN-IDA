'use client'

import Link from 'next/link'

// Errore inatteso dentro una pagina (per esempio il database non risponde)
export default function Errore({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <p className="marchio">TaskEase</p>
      <h1>Non è andata</h1>
      <p>Qualcosa non ha funzionato: può essere la connessione o un problema nostro. Quello che hai scritto non è stato salvato.</p>
      <button type="button" className="bottone" onClick={() => reset()}>
        Riprova
      </button>
      <Link href="/" className="secondario">
        Torna alla home
      </Link>
    </>
  )
}
