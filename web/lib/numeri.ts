// Legge il JSON restituito da public.numeri(): ogni campo mancante o del tipo sbagliato diventa 0 / null / {}.
// Così, se la funzione SQL cambia, il pannello mostra zeri invece di rompersi in silenzio.
export type Numeri = {
  iscritti: number
  iscritti_periodo: number
  professionisti: number
  professionisti_verificati: number
  prenotazioni_per_stato: Record<string, number>
  giudizi: number
  ida_medio: number | null
  post_aperti: number
  segnalazioni_aperte: number
  verifiche_in_attesa: number
  clienti_che_tornano: number
  eventi: Record<string, number>
  uscite: Record<string, number>
}

const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const conteggi = (v: unknown): Record<string, number> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  return Object.fromEntries(Object.entries(v).map(([k, n]) => [k, numero(n)]))
}

export function leggiNumeri(dati: unknown): Numeri {
  const d = dati && typeof dati === 'object' && !Array.isArray(dati) ? (dati as Record<string, unknown>) : {}
  return {
    iscritti: numero(d.iscritti),
    iscritti_periodo: numero(d.iscritti_periodo),
    professionisti: numero(d.professionisti),
    professionisti_verificati: numero(d.professionisti_verificati),
    prenotazioni_per_stato: conteggi(d.prenotazioni_per_stato),
    giudizi: numero(d.giudizi),
    ida_medio: typeof d.ida_medio === 'number' ? d.ida_medio : null,
    post_aperti: numero(d.post_aperti),
    segnalazioni_aperte: numero(d.segnalazioni_aperte),
    verifiche_in_attesa: numero(d.verifiche_in_attesa),
    clienti_che_tornano: numero(d.clienti_che_tornano),
    eventi: conteggi(d.eventi),
    uscite: conteggi(d.uscite),
  }
}
