// Icone a linea dell'anteprima (niente emoji)
const PERCORSI: Record<string, string> = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  message: 'M4 5h16v10H9l-4 4V5z',
  bolt: 'M13 3L5 13h5l-1 8 8-10h-5l1-8z',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  arrowL: 'M19 12H5M11 6l-6 6 6 6',
  check: 'M5 12l4 4 10-11',
  cal: 'M5 7h14v13H5zM5 7l0-3M19 7l0-3M9 4v3M15 4v3M5 11h14',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0',
  shield: 'M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  star: 'M12 3l2.6 5.5L20 9.3l-4 4 1 6-5-2.9L7 19.3l1-6-4-4 5.4-.8L12 3z',
  plus: 'M12 5v14M5 12h14',
  home: 'M4 11l8-7 8 7M6 10v9h12v-9',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c0-3.5 3-6 7-6s7 2.5 7 6',
  x: 'M6 6l12 12M18 6L6 18',
  send: 'M5 12l15-7-7 15-2-6-6-2z',
  wrench: 'M14 7a4 4 0 0 1-5 5l-5 5 2 2 5-5a4 4 0 0 0 5-5l-2 2-2-2 2-2z',
  drop: 'M12 3s6 6 6 10a6 6 0 1 1-12 0c0-4 6-10 6-10z',
  leaf: 'M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c3-3 6-5 9-6',
  chair: 'M6 4v8h12V4M6 12l-1 8M18 12l1 8M5 12h14',
  broom: 'M16 4l4 4M14 6l4 4-7 7H6l-2-2 8-9zM6 17l-2 3',
  chip: 'M7 7h10v10H7zM4 10v4M4 10h3M4 14h3M20 10v4M17 10h3M17 14h3M10 4h4M10 4v3M14 4v3M10 20v-3M14 20v-3',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9l-2 4-4 2 2-4 4-2z',
  seal: 'M12 3l2 2 3-1 1 3 3 1-1 3 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-1-3 3-1 1-3 3 1 2-2z',
  heart: 'M12 20s-7-4.5-7-9.5a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 5-7 9.5-7 9.5z',
  book: 'M12 6c-2-1.3-4.5-1.3-7-.8v12c2.5-.5 5-.5 7 .8 2-1.3 4.5-1.3 7-.8v-12c-2.5-.5-5-.5-7 .8zM12 6v12',
  logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  pause: 'M9 6v12M15 6v12',
  phone: 'M7 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L17 12l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 5 5a2 2 0 0 1 2-2z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
}

export type NomeIcona = keyof typeof PERCORSI

export function Icona({ nome, lato = 22, spessore = 1.7, colore = 'currentColor' }: { nome: string; lato?: number; spessore?: number; colore?: string }) {
  return (
    <svg width={lato} height={lato} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="icona" stroke={colore} strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round">
      <path d={PERCORSI[nome] ?? PERCORSI.star} />
    </svg>
  )
}
