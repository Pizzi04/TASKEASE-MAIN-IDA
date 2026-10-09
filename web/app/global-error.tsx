'use client'

// Errore nel layout principale: pagina minima, senza dipendere da nulla
export default function ErroreGrave({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, minHeight: '100dvh', background: '#0E1C19', color: '#F3EFE6', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 420, margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
          <h1>TaskEase non risponde</h1>
          <p style={{ color: '#C4CEC9' }}>Riprova tra qualche minuto. Se il problema resta, scrivici dall’assistenza.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ minHeight: 48, padding: '0 24px', border: 0, borderRadius: 14, background: '#8F6320', color: '#fff', font: 'inherit', fontWeight: 700 }}
          >
            Riprova
          </button>
        </main>
      </body>
    </html>
  )
}
