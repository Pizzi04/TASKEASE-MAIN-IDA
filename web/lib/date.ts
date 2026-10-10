import { adessoARoma, aggiungiGiorni } from './validazione'

const FMT_GIORNO = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

// "Oggi", "Domani", "Ieri" o "sab 12 ott"
export function etichettaGiorno(iso: string, adesso = new Date()): string {
  const oggi = adessoARoma(adesso).giorno
  if (iso === oggi) return 'Oggi'
  if (iso === aggiungiGiorni(oggi, 1)) return 'Domani'
  if (iso === aggiungiGiorni(oggi, -1)) return 'Ieri'
  const [a, m, g] = iso.split('-').map(Number)
  return FMT_GIORNO.format(new Date(Date.UTC(a, m - 1, g)))
}

// I prossimi n giorni a partire da oggi (ora italiana)
export function prossimiGiorni(n: number, adesso = new Date()): { iso: string; etichetta: string }[] {
  const oggi = adessoARoma(adesso).giorno
  return Array.from({ length: n }, (_, i) => {
    const iso = aggiungiGiorni(oggi, i)
    return { iso, etichetta: etichettaGiorno(iso, adesso) }
  })
}

export function oraBreve(ora: string): string {
  return ora.slice(0, 5)
}

export function quandoFa(iso: string, adesso = new Date()): string {
  const s = Math.max(0, Math.round((adesso.getTime() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'adesso'
  if (s < 3600) return `${Math.floor(s / 60)} min fa`
  if (s < 86400) return `${Math.floor(s / 3600)} ore fa`
  const g = Math.floor(s / 86400)
  if (g === 1) return 'ieri'
  if (g < 30) return `${g} giorni fa`
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

// La prenotazione è nel passato (ora italiana)?
export function passata(giorno: string, ora: string, adesso = new Date()): boolean {
  const { giorno: oggi, minuti } = adessoARoma(adesso)
  if (giorno !== oggi) return giorno < oggi
  const [h, m] = ora.split(':').map(Number)
  return h * 60 + m <= minuti
}

// Il lavoro è finito: passate anche le ore previste (serve per "Lavoro fatto")
export function finita(giorno: string, ora: string, ore: number | null, adesso = new Date()): boolean {
  const { giorno: oggi, minuti } = adessoARoma(adesso)
  const [h, m] = ora.split(':').map(Number)
  const fine = h * 60 + m + (ore ?? 1) * 60
  if (giorno === oggi) return fine <= minuti
  if (giorno > oggi) return false
  if (fine <= 1440) return true
  const ieri = new Date(Date.parse(oggi + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10)
  return giorno < ieri || fine - 1440 <= minuti
}

// Ora (e giorno, se non è oggi) di un istante, sempre all'ora italiana: uguale su server e browser
const FMT_ORA = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
const FMT_GIORNO_ROMA = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Rome' })
export function orarioMessaggio(istante: string, adesso = new Date()): string {
  const d = new Date(istante)
  const ora = FMT_ORA.format(d)
  const giorno = FMT_GIORNO_ROMA.format(d)
  return giorno === adessoARoma(adesso).giorno ? ora : `${etichettaGiorno(giorno, adesso)}, ${ora}`
}
