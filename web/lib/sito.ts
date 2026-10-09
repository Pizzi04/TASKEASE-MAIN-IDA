// Indirizzo pubblico del sito (per anteprime social, sitemap e robots).
// Su Vercel, se NEXT_PUBLIC_SITO_URL manca, si usa il dominio di produzione del progetto.
export function urlSito(): URL {
  const da = process.env.NEXT_PUBLIC_SITO_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  return new URL(da || 'http://localhost:3000')
}

export const DESCRIZIONE = 'Chi lavora vicino a casa tua a Forlì e Cesena, giudicato solo da chi l’ha davvero chiamato.'

// Le sole pagine visibili senza accesso: il resto dell'app chiede di entrare
export const PAGINE_PUBBLICHE = ['/accedi', '/assistenza', '/legale/termini', '/legale/privacy'] as const
