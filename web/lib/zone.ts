// Posizione indicativa dei quartieri sulla mappa (stessa dell'anteprima, in percentuale).
// La distanza si calcola dalla zona, mai dall'indirizzo.
export const QUARTIERI: Record<string, { x: number; y: number }> = {
  Centro: { x: 49, y: 44 },
  Saffi: { x: 27, y: 34 },
  Cava: { x: 71, y: 29 },
  Ronco: { x: 74, y: 60 },
  Villafranca: { x: 21, y: 64 },
  Bussecchio: { x: 56, y: 73 },
  Vecchiazzano: { x: 83, y: 40 },
}

const LONTANO = 1000

// Distanza tra la zona del cliente e la più vicina tra le zone di chi lavora
export function distanza(mia: string, zone: readonly string[]): number {
  if (zone.includes(mia)) return 0
  const a = QUARTIERI[mia]
  let migliore = LONTANO
  for (const z of zone) {
    const b = QUARTIERI[z]
    if (a && b) migliore = Math.min(migliore, Math.hypot(a.x - b.x, a.y - b.y))
  }
  return migliore
}

export type Ordine = 'vicini' | 'prezzo' | 'ida'

type Ordinabile = { zone: readonly string[]; tariffa_oraria: number; su_preventivo?: boolean; ida: number | null; giudizi: number; nome: string }

// Ordine di partenza: dal più vicino. Nessuno paga per comparire prima.
// Per IDA: chi è nuovo (senza IDA) va in fondo.
export function ordina<T extends Ordinabile>(lista: T[], mia: string, ordine: Ordine): T[] {
  const idaDi = (p: T) => (p.ida != null && p.giudizi >= 3 ? p.ida : -1)
  return [...lista].sort((a, b) => {
    // Chi lavora su preventivo non ha un prezzo da confrontare: va in fondo
    if (ordine === 'prezzo' && !!a.su_preventivo !== !!b.su_preventivo) return a.su_preventivo ? 1 : -1
    if (ordine === 'prezzo' && a.tariffa_oraria !== b.tariffa_oraria) return a.tariffa_oraria - b.tariffa_oraria
    if (ordine === 'ida' && idaDi(a) !== idaDi(b)) return idaDi(b) - idaDi(a)
    const d = distanza(mia, a.zone) - distanza(mia, b.zone)
    return d !== 0 ? d : a.nome.localeCompare(b.nome, 'it')
  })
}
