// Regole IDA v1.0: identiche al calcolo nel database (colonna giudizi.punteggio).

export const VOCI = [
  { k: 'puntualita', l: 'Puntualità', peso: 0.2 },
  { k: 'qualita', l: 'Qualità del lavoro', peso: 0.3 },
  { k: 'parola', l: 'Parola mantenuta', peso: 0.2 },
  { k: 'pulizia', l: 'Pulizia', peso: 0.15 },
  { k: 'comunicazione', l: 'Comunicazione', peso: 0.15 },
] as const

export type Voce = (typeof VOCI)[number]['k']
export type Voti = Record<Voce, number>

// L'IDA si mostra solo dopo questo numero di lavori giudicati
export const IDA_MIN_LAVORI = 3

// 5 voci da 1 a 5 → punteggio da 20 a 100
export function punteggioDa(v: Voti): number {
  return Math.round(VOCI.reduce((s, x) => s + v[x.k] * x.peso, 0) * 20)
}

export const LIVELLI = {
  diamante: { l: 'Maestro', c: '#7FD1BC' },
  oro: { l: 'Esperto', c: '#E2B672' },
  argento: { l: 'Affidabile', c: '#C4CEC9' },
  crescita: { l: 'In crescita', c: '#93A69F' },
  ferro: { l: 'Base', c: '#93A69F' },
  bronzo: { l: 'Nuovo', c: '#93A69F' },
} as const
export type Livello = keyof typeof LIVELLI

// Il livello si ricava SEMPRE dal numero, mai assegnato a mano
export function livelloDi(ida: number | null, giudizi: number): Livello {
  if (ida == null || giudizi < IDA_MIN_LAVORI) return 'bronzo'
  if (ida >= 95) return 'diamante'
  if (ida >= 88) return 'oro'
  if (ida >= 78) return 'argento'
  if (ida >= 60) return 'crescita'
  return 'ferro'
}

// IDA da mostrare: null finché il profilo è nuovo
export function idaVisibile(ida: number | null, giudizi: number): number | null {
  return ida != null && giudizi >= IDA_MIN_LAVORI ? ida : null
}

export function leggiVoti(form: FormData): Voti | null {
  const voti = {} as Voti
  for (const { k } of VOCI) {
    const n = Number(form.get(k))
    if (!Number.isInteger(n) || n < 1 || n > 5) return null
    voti[k] = n
  }
  return voti
}
