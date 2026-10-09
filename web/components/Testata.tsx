import Link from 'next/link'

// Titolo della pagina con freccia "indietro"
export function Testata({ titolo, indietro, sotto }: { titolo: string; indietro?: string; sotto?: React.ReactNode }) {
  return (
    <header className="testata">
      {indietro && (
        <Link href={indietro} className="indietro" aria-label="Indietro">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <div>
        <h1>{titolo}</h1>
        {sotto && <p className="sottotitolo">{sotto}</p>}
      </div>
    </header>
  )
}
