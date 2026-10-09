import type { Instrumentation } from 'next'

// Ogni errore del server finisce nei log (Vercel → Logs) come una riga JSON cercabile.
// Solo il percorso, senza parametri: niente dati personali nei log.
export const onRequestError: Instrumentation.onRequestError = (errore, richiesta, contesto) => {
  const e = errore as Error & { digest?: string }
  console.error(
    JSON.stringify({
      livello: 'errore',
      messaggio: e.message,
      digest: e.digest,
      metodo: richiesta.method,
      percorso: richiesta.path.split('?')[0],
      tipo: contesto.routeType,
      pagina: contesto.routePath,
    }),
  )
}
