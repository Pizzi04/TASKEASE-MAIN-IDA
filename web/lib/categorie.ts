// Colore e icona di ogni mestiere, come nell'anteprima (app/src/dati.js).
// Il colore tinge l'avatar di chi lavora: a colpo d'occhio si vede cosa fa.

export type Categoria = { n: string; ic: string; c: string; bg: string }

// Le categorie in evidenza in home e in Cerca
export const CATEGORIE: Categoria[] = [
  { n: 'Riparazioni', ic: 'wrench', c: '#E2B672', bg: '#3A2E1A' },
  { n: 'Pulizie', ic: 'broom', c: '#6FC7BC', bg: '#173430' },
  { n: 'Montaggio mobili', ic: 'chair', c: '#E39A6E', bg: '#3A2419' },
  { n: 'Tecnologia / PC', ic: 'chip', c: '#AFA0E0', bg: '#29243A' },
  { n: 'Giardino', ic: 'leaf', c: '#9CCB80', bg: '#22331C' },
  { n: 'Idraulica', ic: 'drop', c: '#7FB0D6', bg: '#1C2B38' },
  { n: 'Tuttofare', ic: 'wrench', c: '#E2B672', bg: '#3A2E1A' },
]

const REGOLE: [RegExp, string][] = [
  [/idraul/i, '#7FB0D6'],
  [/elettric|riparaz|tuttofare|piccoli lavori/i, '#E2B672'],
  [/puliz|stir/i, '#6FC7BC'],
  [/montagg|mobili|trasloc|conseg/i, '#E39A6E'],
  [/tecnolog|pc/i, '#AFA0E0'],
  [/giardin/i, '#9CCB80'],
]

// Colore del primo mestiere riconosciuto; verde salvia se nessuno
export function coloreDi(competenze: readonly string[]): string {
  for (const c of competenze) for (const [re, col] of REGOLE) if (re.test(c)) return col
  return '#9CC3B8'
}

// Saluto secondo l'ora italiana
export function saluto(ora: number): string {
  if (ora < 5) return 'Buonasera'
  if (ora < 12) return 'Buongiorno'
  if (ora < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}
