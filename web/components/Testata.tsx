import Link from 'next/link'
import { Icona } from './Icona'

// Titolo della pagina con freccia "indietro" in un riquadro, su una barra di vetro che resta in alto
export function Testata({ titolo, indietro, sotto }: { titolo: string; indietro?: string; sotto?: React.ReactNode }) {
  return (
    <header className={indietro ? 'testata' : 'testata radice'}>
      {indietro && (
        <Link href={indietro} className="indietro" aria-label="Indietro">
          <Icona nome="arrowL" lato={20} />
        </Link>
      )}
      <div>
        <h1>{titolo}</h1>
        {sotto && <p className="sottotitolo">{sotto}</p>}
      </div>
    </header>
  )
}
