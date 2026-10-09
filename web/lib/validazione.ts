// Regole condivise da pagine e azioni server. Le stesse regole sono anche
// vincoli nel database (tabella profili): qui servono a dare errori chiari.

export const ZONE = [
  'Centro',
  'Saffi',
  'Cava',
  'Ronco',
  'Villafranca',
  'Bussecchio',
  'Vecchiazzano',
  'Altra zona di Forlì',
  'Cesena e dintorni',
] as const

export type Zona = (typeof ZONE)[number]

// Documenti che l'utente accetta alla creazione del profilo.
// Cambiando il testo di un documento si alza la versione: resta traccia di cosa è stato accettato.
export const DOCUMENTI = [
  { documento: 'termini', versione: '2026-10' },
  { documento: 'privacy', versione: '2026-10' },
] as const

// Cellulare italiano in formato internazionale (+393331234567), oppure null.
// Accetta spazi, trattini, punti, parentesi e i prefissi +39 / 0039 / 39.
export function normalizzaTelefono(testo: string): string | null {
  let cifre = testo.trim()
  if (!/^[+\d\s\-().]+$/.test(cifre)) return null
  cifre = cifre.replace(/[\s\-().]/g, '')
  if (cifre.startsWith('+39')) cifre = cifre.slice(3)
  else if (cifre.startsWith('0039')) cifre = cifre.slice(4)
  else if (cifre.startsWith('+')) return null
  else if (cifre.length > 10 && cifre.startsWith('39')) cifre = cifre.slice(2)
  if (!/^3\d{8,9}$/.test(cifre)) return null
  return '+39' + cifre
}

// Mostra +393331234567 come +39 333 123 4567.
export function mostraTelefono(e164: string): string {
  const n = e164.replace(/^\+39/, '')
  return `+39 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

export function codiceOtpValido(testo: string): boolean {
  return /^\d{6}$/.test(testo.trim())
}

export function nomeValido(testo: string): boolean {
  const n = testo.trim()
  return n.length >= 2 && n.length <= 60
}

export function zonaValida(testo: string): testo is Zona {
  return (ZONE as readonly string[]).includes(testo)
}

export type DatiProfilo = { nome: string; zona: Zona }

// Controlla i campi del modulo "nuovo profilo". Restituisce i dati puliti o il primo errore.
export function leggiProfilo(campi: {
  nome: unknown
  zona: unknown
  consenso: unknown
}): { ok: true; dati: DatiProfilo } | { ok: false; errore: string } {
  const nome = typeof campi.nome === 'string' ? campi.nome.trim().replace(/\s+/g, ' ') : ''
  const zona = typeof campi.zona === 'string' ? campi.zona : ''
  if (!nomeValido(nome)) return { ok: false, errore: 'Scrivi un nome da 2 a 60 caratteri.' }
  if (!zonaValida(zona)) return { ok: false, errore: 'Scegli la tua zona dall’elenco.' }
  if (campi.consenso !== 'si') {
    return { ok: false, errore: 'Per continuare accetta i termini e l’informativa privacy.' }
  }
  return { ok: true, dati: { nome, zona } }
}
