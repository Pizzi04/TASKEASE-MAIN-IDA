// Regole condivise da pagine e azioni server. Le stesse regole sono anche
// vincoli nel database: qui servono a dare errori chiari prima di salvare.

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

export const COMPETENZE = [
  'Idraulica',
  'Elettricità',
  'Piccoli lavori (senza impianti)',
  'Tuttofare',
  'Riparazioni',
  'Piastrelle e pavimenti',
  'Muratura e cartongesso',
  'Imbiancatura',
  'Pulizie',
  'Montaggio mobili',
  'Giardino',
  'Tecnologia / PC',
  'Ripetizioni',
  'Consegne',
  'Traslochi',
] as const
export type Competenza = (typeof COMPETENZE)[number]

// Lavori su impianti: solo imprese con Partita IVA e abilitazione (DM 37/2008)
export const COMPETENZE_IMPIANTI: readonly string[] = ['Idraulica', 'Elettricità']

export const ORARI = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'] as const

// Documenti che l'utente accetta. Cambiando un testo si alza la versione.
export const VERSIONE_DOCUMENTI = '2026-10'
export const DOCUMENTI = [
  { documento: 'termini', versione: VERSIONE_DOCUMENTI },
  { documento: 'privacy', versione: VERSIONE_DOCUMENTI },
] as const

export type Esito<T> = { ok: true; dati: T } | { ok: false; errore: string }

// Caratteri invisibili e di inversione del testo (es. U+202E): servono solo a ingannare ("Carla" che appare "alraC").
// Lo ZWJ (U+200D) resta: unisce le emoji composte.
const INVISIBILI = /[​‎‏‪-‮⁠⁦-⁩﻿]/g
export const pulisci = (v: unknown) => (typeof v === 'string' ? v.replace(INVISIBILI, '').trim() : '')
const testo = pulisci
const spazi = (v: string) => v.replace(/\s+/g, ' ')

// ---------- Telefono e codice ----------

// Cellulare italiano in formato internazionale (+393331234567), oppure null.
export function normalizzaTelefono(t: string): string | null {
  let cifre = t.trim()
  if (!/^[+\d\s\-().]+$/.test(cifre)) return null
  cifre = cifre.replace(/[\s\-().]/g, '')
  if (cifre.startsWith('+39')) cifre = cifre.slice(3)
  else if (cifre.startsWith('0039')) cifre = cifre.slice(4)
  else if (cifre.startsWith('+')) return null
  else if (cifre.length > 10 && cifre.startsWith('39')) cifre = cifre.slice(2)
  if (!/^3\d{8,9}$/.test(cifre)) return null
  return '+39' + cifre
}

// +393331234567 (o 393331234567) → +39 333 123 4567
export function mostraTelefono(numero: string): string {
  const n = numero.replace(/^\+?39/, '')
  return `+39 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

export function codiceOtpValido(t: string): boolean {
  return /^\d{6}$/.test(t.trim())
}

// ---------- Profilo ----------

export function nomeValido(t: string): boolean {
  const n = t.trim()
  return n.length >= 2 && n.length <= 60 && (n.match(/\p{L}/gu)?.length ?? 0) >= 2
}

export function zonaValida(t: string): t is Zona {
  return (ZONE as readonly string[]).includes(t)
}

export function competenzaValida(t: string): t is Competenza {
  return (COMPETENZE as readonly string[]).includes(t)
}

export type DatiProfilo = { nome: string; zona: Zona }

export function leggiProfilo(campi: { nome: unknown; zona: unknown; consenso: unknown }): Esito<DatiProfilo> {
  const nome = spazi(testo(campi.nome))
  const zona = testo(campi.zona)
  if (!nomeValido(nome)) return { ok: false, errore: 'Scrivi un nome da 2 a 60 caratteri.' }
  if (!zonaValida(zona)) return { ok: false, errore: 'Scegli la tua zona dall’elenco.' }
  if (campi.consenso !== 'si') {
    return { ok: false, errore: 'Per continuare accetta i termini e l’informativa privacy.' }
  }
  return { ok: true, dati: { nome, zona } }
}

export function leggiModificaProfilo(campi: { nome: unknown; zona: unknown }): Esito<DatiProfilo> {
  return leggiProfilo({ ...campi, consenso: 'si' })
}

// ---------- Dati fiscali ----------

const CF_DISPARI: Record<string, number> = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
}

export function cfFormatoOk(cf: string): boolean {
  return /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf)
}

// Controlla anche il carattere finale, calcolato dagli altri 15
export function codiceFiscaleValido(t: string): boolean {
  const cf = t.trim().toUpperCase()
  if (!cfFormatoOk(cf)) return false
  let tot = 0
  for (let i = 0; i < 15; i++) {
    const c = cf[i]
    tot += i % 2 === 0 ? CF_DISPARI[c] : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65
  }
  return String.fromCharCode(65 + (tot % 26)) === cf[15]
}

// Partita IVA: 11 cifre con cifra di controllo
export function partitaIvaValida(t: string): boolean {
  const p = t.replace(/\s/g, '')
  if (!/^\d{11}$/.test(p) || /^0{11}$/.test(p)) return false
  let tot = 0
  for (let i = 0; i < 10; i++) {
    let n = Number(p[i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    tot += n
  }
  return (10 - (tot % 10)) % 10 === Number(p[10])
}

export function etaDa(iso: string, oggi = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [a, m, g] = iso.split('-').map(Number)
  const nascita = new Date(a, m - 1, g)
  if (nascita.getMonth() !== m - 1 || nascita > oggi) return null
  let eta = oggi.getFullYear() - a
  if (oggi < new Date(oggi.getFullYear(), m - 1, g)) eta--
  return eta
}

export type DatiProfessionista = {
  bio: string
  competenze: Competenza[]
  zone: Zona[]
  tariffa: number
  suPreventivo: boolean
  tipo: 'privato' | 'piva'
  partitaIva: string | null
  abilitazione: boolean
  assicurazione: boolean
}

export type DatiFiscali = { codiceFiscale: string; dataNascita: string; residenza: string }

// Scheda pubblica: stessa regola per "diventa professionista" e "modifica scheda"
export function leggiScheda(form: FormData): Esito<DatiProfessionista> {
  const valore = (n: string) => form.get(n)
  const competenze = [...new Set(form.getAll('competenze').map(testo))]
  const zone = [...new Set(form.getAll('zone').map(testo))]
  const tipo = testo(valore('tipo'))
  const partitaIva = testo(valore('partita_iva')).replace(/\s/g, '')
  const tariffa = Number(testo(valore('tariffa')))
  const bio = spazi(testo(valore('bio')))
  const abilitazione = valore('abilitazione') === 'si'

  if (tipo !== 'privato' && tipo !== 'piva') return { ok: false, errore: 'Scegli se sei un privato o hai Partita IVA.' }
  if (tipo === 'piva' && !partitaIvaValida(partitaIva)) return { ok: false, errore: 'La Partita IVA non è valida: controlla le 11 cifre.' }
  if (competenze.length === 0) return { ok: false, errore: 'Scegli almeno una competenza.' }
  if (!competenze.every(competenzaValida)) return { ok: false, errore: 'Una competenza non è nell’elenco.' }
  const impianti = competenze.some((c) => COMPETENZE_IMPIANTI.includes(c))
  if (impianti && tipo !== 'piva') return { ok: false, errore: 'Idraulica ed elettricità sono solo per imprese con Partita IVA: toglile.' }
  if (impianti && !abilitazione) return { ok: false, errore: 'Per idraulica ed elettricità serve dichiarare l’abilitazione.' }
  if (zone.length === 0) return { ok: false, errore: 'Scegli almeno una zona.' }
  if (!zone.every(zonaValida)) return { ok: false, errore: 'Una zona non è nell’elenco.' }
  if (!Number.isInteger(tariffa) || tariffa < 5 || tariffa > 200) return { ok: false, errore: 'La tariffa va da 5 a 200 € l’ora.' }
  if (bio.length > 300) return { ok: false, errore: 'La presentazione è troppo lunga (massimo 300 caratteri).' }
  if (haContatti(bio)) return { ok: false, errore: 'Nella presentazione non scrivere telefono, email o indirizzo.' }

  return {
    ok: true,
    dati: {
      bio,
      competenze: competenze as Competenza[],
      zone: zone as Zona[],
      tariffa,
      suPreventivo: valore('su_preventivo') === 'si',
      tipo,
      partitaIva: tipo === 'piva' ? partitaIva : null,
      abilitazione: tipo === 'piva' && impianti && abilitazione,
      assicurazione: valore('assicurazione') === 'si',
    },
  }
}

export function leggiDatiFiscali(form: FormData, oggi = new Date()): Esito<DatiFiscali> {
  const codiceFiscale = testo(form.get('codice_fiscale')).toUpperCase().replace(/\s/g, '')
  const dataNascita = testo(form.get('data_nascita'))
  const residenza = spazi(testo(form.get('residenza')))
  const eta = etaDa(dataNascita, oggi)
  if (eta == null) return { ok: false, errore: 'Manca la data di nascita.' }
  if (eta < 18) return { ok: false, errore: 'Per lavorare su TaskEase servono 18 anni.' }
  if (residenza.length < 6) return { ok: false, errore: 'Manca l’indirizzo di residenza.' }
  if (!codiceFiscaleValido(codiceFiscale)) {
    return {
      ok: false,
      errore: cfFormatoOk(codiceFiscale)
        ? 'Il codice fiscale non torna: controlla l’ultima lettera.'
        : 'Manca il codice fiscale (16 caratteri).',
    }
  }
  if (form.get('dichiarazione_fiscale') !== 'si') return { ok: false, errore: 'Manca la dichiarazione fiscale.' }
  if (form.get('termini') !== 'si') return { ok: false, errore: 'Manca l’accettazione dei Termini per chi lavora.' }
  return { ok: true, dati: { codiceFiscale, dataNascita, residenza } }
}

// ---------- Contenuti pubblici ----------

// Telefono (anche fisso o con prefisso) o email. Non scatta su misure e prezzi ("120 cm", "30 €").
const TEL_RE =
  /(?:\+|\b00)39[\s.-]?\d{2,4}[\s.-]?\d{3,4}|(?<![\d,.])3\d{2}(?:[\s./-]?\d{3}[\s.-]?\d{3,4}|[\s./-]?\d{6,7})(?!\d|,\d|\s*(?:mm|cm|m|mt|kg|g|€|euro|eur)\b)|(?<![\d,.])0\d{1,3}[\s./-]?\d{5,8}(?!\d|,\d|\s*(?:mm|cm|m|kg|€|euro)\b)|\d{9,}/i
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i
// Indirizzo: via/piazza… + nome con la maiuscola + numero civico
const VIA_RE =
  /\b(?:[Vv]ia|[Vv]iale|[Pp]iazza(?:le)?|[Bb]orgo|[Cc]orso|[Vv]icolo|[Ll]argo|[Ss]trada|[Cc]ontrada)\s+(?:(?:del|dello|della|dei|degli|delle|di|da)\s+|dell'|d')?(?:\d{1,2}\s+)?[A-ZÀ-Ú][\wà-ù'.]*(?:\s+(?:[A-ZÀ-Ú][\wà-ù'.]*|del|della|dei|di))*\s*,?\s*(?:n\.?\s*)?\d{1,4}\s?[a-zA-Z]?\b/

export function haTelefonoOEmail(t: string): boolean {
  return TEL_RE.test(t) || EMAIL_RE.test(t)
}
export function haIndirizzo(t: string): boolean {
  return VIA_RE.test(t)
}
export function haContatti(t: string): boolean {
  return haTelefonoOEmail(t) || haIndirizzo(t)
}

export type DatiPost = { titolo: string; dettagli: string; zona: Zona; competenza: Competenza | null }

export function leggiPost(form: FormData): Esito<DatiPost> {
  const titolo = spazi(testo(form.get('titolo')))
  const dettagli = testo(form.get('dettagli'))
  const zona = testo(form.get('zona'))
  const competenza = testo(form.get('competenza'))
  if (titolo.length < 5 || titolo.length > 100) return { ok: false, errore: 'Scrivi cosa ti serve (da 5 a 100 caratteri).' }
  if (dettagli.length > 600) return { ok: false, errore: 'I dettagli sono troppo lunghi (massimo 600 caratteri).' }
  const tutto = titolo + ' ' + dettagli
  if (haTelefonoOEmail(tutto)) return { ok: false, errore: 'Togli telefono o email: la bacheca la vedono tutti. Li dai in chat a chi scegli.' }
  if (haIndirizzo(tutto)) return { ok: false, errore: 'Togli l’indirizzo: la bacheca la vedono tutti. Lo dai a chi scegli.' }
  if (!zonaValida(zona)) return { ok: false, errore: 'Scegli la zona.' }
  if (competenza && !competenzaValida(competenza)) return { ok: false, errore: 'Categoria non valida.' }
  return { ok: true, dati: { titolo, dettagli, zona, competenza: competenza ? (competenza as Competenza) : null } }
}

// ---------- Prenotazione ----------

export type DatiPrenotazione = {
  competenza: Competenza
  descrizione: string
  indirizzo: string
  zona: Zona
  giorno: string
  ora: string
  ore: number | null
}

// Data e ora come le legge una persona a Forlì, indipendentemente dal fuso del server
export function adessoARoma(adesso = new Date()): { giorno: string; minuti: number } {
  const parti = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(adesso)
  const p = (t: string) => parti.find((x) => x.type === t)?.value ?? '00'
  return { giorno: `${p('year')}-${p('month')}-${p('day')}`, minuti: Number(p('hour')) * 60 + Number(p('minute')) }
}

export function aggiungiGiorni(iso: string, n: number): string {
  const [a, m, g] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1, g + n))
  return d.toISOString().slice(0, 10)
}

// Un orario si può prenotare se manca almeno un'ora ed è entro 30 giorni
export function orarioPrenotabile(giorno: string, ora: string, adesso = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(giorno) || !(ORARI as readonly string[]).includes(ora)) return false
  const { giorno: oggi, minuti } = adessoARoma(adesso)
  if (giorno < oggi || giorno > aggiungiGiorni(oggi, 30)) return false
  if (giorno > oggi) return true
  const [h, m] = ora.split(':').map(Number)
  return h * 60 + m - minuti >= 60
}

export function leggiPrenotazione(form: FormData, competenzeOfferte: readonly string[], adesso = new Date()): Esito<DatiPrenotazione> {
  const competenza = testo(form.get('competenza'))
  const descrizione = spazi(testo(form.get('descrizione')))
  const indirizzo = spazi(testo(form.get('indirizzo')))
  const zona = testo(form.get('zona'))
  const giorno = testo(form.get('giorno'))
  const ora = testo(form.get('ora'))
  const oreTesto = testo(form.get('ore'))
  const ore = oreTesto === '' || oreTesto === 'non_so' ? null : Number(oreTesto)

  if (!competenzaValida(competenza) || !competenzeOfferte.includes(competenza)) return { ok: false, errore: 'Scegli cosa ti serve.' }
  if (descrizione.length < 8) return { ok: false, errore: 'Scrivi in due righe cosa c’è da fare.' }
  if (descrizione.length > 500) return { ok: false, errore: 'La descrizione è troppo lunga (massimo 500 caratteri).' }
  if (!orarioPrenotabile(giorno, ora, adesso)) return { ok: false, errore: 'Scegli un orario: almeno un’ora da adesso, entro 30 giorni.' }
  if (indirizzo.length < 4) return { ok: false, errore: 'Manca l’indirizzo.' }
  if (indirizzo.length > 200) return { ok: false, errore: 'L’indirizzo è troppo lungo.' }
  if (!zonaValida(zona)) return { ok: false, errore: 'Scegli la zona.' }
  if (ore !== null && (!Number.isInteger(ore) || ore < 1 || ore > 8)) return { ok: false, errore: 'Le ore vanno da 1 a 8.' }
  return { ok: true, dati: { competenza, descrizione, indirizzo, zona, giorno, ora, ore } }
}

// ---------- Segnalazioni ----------

export const MOTIVI_CONTENUTO = [
  'Offensivo o diffamatorio',
  'Falso o ingannevole',
  'Contiene dati personali di qualcuno',
  'Possibile truffa',
  'Altro contenuto illegale',
] as const

export const MOTIVI_LAVORO = [
  'Nessuno si è presentato',
  'Lavoro fatto male',
  'Prezzo diverso dal pattuito',
  'Comportamento scorretto',
  'Altro',
] as const

export const MOTIVI_USCITA = [
  'Non ho trovato chi cercavo',
  'Poche richieste nella mia zona',
  'Ho risolto in altro modo',
  'Mi preoccupa la privacy',
  'Altro',
] as const

export function leggiSegnalazione(form: FormData): Esito<{ motivo: string; testo: string | null }> {
  const tipo = testo(form.get('tipo'))
  const motivo = testo(form.get('motivo'))
  const t = testo(form.get('testo'))
  const motivi: readonly string[] = tipo === 'problema_lavoro' ? MOTIVI_LAVORO : MOTIVI_CONTENUTO
  if (!motivi.includes(motivo)) return { ok: false, errore: 'Scegli un motivo.' }
  if ((motivo === 'Altro' || motivo === 'Altro contenuto illegale') && t.length < 10) {
    return { ok: false, errore: 'Racconta in almeno 10 caratteri cosa è successo.' }
  }
  if (t.length > 1000) return { ok: false, errore: 'Il testo è troppo lungo (massimo 1000 caratteri).' }
  return { ok: true, dati: { motivo, testo: t || null } }
}
