import Link from 'next/link'

export const metadata = { title: 'Pagina non trovata · TaskEase' }

export default function NonTrovata() {
  return (
    <>
      <Link href="/" className="marchio">
        TaskEase
      </Link>
      <h1>Qui non c’è niente</h1>
      <p>La pagina non esiste più, oppure l’indirizzo è sbagliato. Se ci sei arrivato da una notifica, forse è stata cancellata.</p>
      <Link href="/" className="bottone">
        Torna alla home
      </Link>
    </>
  )
}
