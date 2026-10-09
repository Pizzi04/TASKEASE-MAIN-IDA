import { IDA_MIN_LAVORI, LIVELLI, idaVisibile, livelloDi } from '@/lib/ida'

// Il sigillo IDA: numero su 100 dentro un anello colorato dal livello.
export function Sigillo({ ida, giudizi, grande = false }: { ida: number | null; giudizi: number; grande?: boolean }) {
  const lv = livelloDi(ida, giudizi)
  const numero = idaVisibile(ida, giudizi)
  const { c, l } = LIVELLI[lv]
  const lato = grande ? 92 : 54
  const r = lato / 2 - 4
  const giro = 2 * Math.PI * r
  const pieno = numero != null ? (numero / 100) * giro : 0
  const descrizione =
    numero != null ? `IDA ${numero} su 100, livello ${l}` : `Profilo nuovo: l’IDA compare dopo ${IDA_MIN_LAVORI} lavori giudicati`
  return (
    <span className={grande ? 'sigillo grande' : 'sigillo'} role="img" aria-label={descrizione} title={descrizione}>
      <svg width={lato} height={lato} viewBox={`0 0 ${lato} ${lato}`} aria-hidden="true">
        <circle cx={lato / 2} cy={lato / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        {numero != null && (
          <circle
            cx={lato / 2}
            cy={lato / 2}
            r={r}
            fill="none"
            stroke={c}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${pieno} ${giro}`}
            transform={`rotate(-90 ${lato / 2} ${lato / 2})`}
          />
        )}
      </svg>
      <span className="sigillo-testo" aria-hidden="true">
        {numero != null ? <b>{numero}</b> : <small>NUOVO</small>}
      </span>
    </span>
  )
}

export function EtichettaLivello({ ida, giudizi }: { ida: number | null; giudizi: number }) {
  const lv = livelloDi(ida, giudizi)
  return (
    <span className="etichetta" style={{ color: LIVELLI[lv].c }}>
      {lv === 'bronzo' ? 'Profilo nuovo' : LIVELLI[lv].l}
    </span>
  )
}
