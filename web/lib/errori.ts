// Errori del database → frasi chiare per chi usa l'app
type ErroreDb = { code?: string; message?: string } | null | undefined

export function messaggioDb(e: ErroreDb, generico = 'Qualcosa non ha funzionato. Riprova tra poco.'): string {
  if (!e) return generico
  if (e.code === '23505') return 'Questo c’è già: forse l’hai appena inviato, oppure l’orario è stato appena preso.'
  if (e.code === '42501') return 'Non hai il permesso di farlo.'
  if (e.code === '23514') return 'Alcuni dati non vanno bene: controlla i campi.'
  if (e.code === 'P0002') return 'Non trovato: forse è stato cancellato.'
  if (e.code === 'P0003') return 'Hai fatto troppe richieste di seguito. Aspetta un po’ e riprova.'
  if (e.code === 'TE409') return 'Quell’orario si accavalla con un lavoro già confermato: scegline un altro.'
  if (e.code === 'P0001') return 'Questa azione ora non è possibile.'
  return generico
}

// Per le azioni senza modulo (interruttori, preferiti, blocchi): se il database rifiuta,
// si lancia un errore e l'utente vede la pagina "Non è andata" con "Riprova", invece di niente.
export function controlla<T extends { error: ErroreDb }>(risposta: T, cosa: string): T {
  if (risposta.error && risposta.error.code !== '23505') throw new Error(`${cosa}: ${messaggioDb(risposta.error)}`)
  return risposta
}
