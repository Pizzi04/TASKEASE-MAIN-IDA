import Link from 'next/link'
import { Conta } from './Conta'
import { QUARTIERI } from '@/lib/zone'

type Punto = { id: string; zone: readonly string[]; disponibile: boolean }

// Mappa schematica dei quartieri (non una cartina vera): un punto per chi lavora, il tuo quartiere cerchiato
export function MappaZona({ persone, mia }: { persone: Punto[]; mia: string }) {
  const L = 160
  const A = 234
  const pos = (z: string) => {
    const q = QUARTIERI[z]
    return q ? [(q.x / 100) * L, (q.y / 100) * A] : null
  }
  const sullaMappa = persone.map((p) => ({ p, xy: p.zone.map(pos).find(Boolean) ?? null })).filter((x) => x.xy)
  const libere = persone.filter((p) => p.disponibile).length
  const qMia = pos(mia)
  return (
    <Link href="/mappa" className="tl map" aria-label={`Mappa della zona: ${libere} ${libere === 1 ? 'persona disponibile' : 'persone disponibili'}. Apri la mappa grande`}>
      <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="#24403A" strokeWidth="7" strokeLinecap="round">
          <path d="M-10 150 C 40 130, 90 160, 170 110" />
          <path d="M70 -10 L 90 250" />
        </g>
        <g fill="none" stroke="#1D3631" strokeWidth="3" strokeLinecap="round">
          <path d="M-10 40 L 170 30" />
          <path d="M20 -10 L 35 250" />
          <path d="M130 -10 L 140 250" />
          <path d="M-10 210 L 170 220" />
        </g>
        {qMia && (
          <>
            <circle className="giro" cx={qMia[0]} cy={qMia[1]} r="30" fill="none" stroke="#4FD1A0" strokeDasharray="3 4" />
            <circle className="onda" cx={qMia[0]} cy={qMia[1]} r="12" fill="none" stroke="#4FD1A0" />
            <circle cx={qMia[0]} cy={qMia[1]} r="4.5" fill="#4FD1A0" />
          </>
        )}
        {sullaMappa.slice(0, 24).map(({ p, xy }, i) => {
          const [x, y] = xy as number[]
          const dx = ((i % 3) - 1) * 11
          const dy = i % 2 ? 9 : -9
          return (
            <g key={p.id}>
              {p.disponibile && <circle className="onda" style={{ animationDelay: `${i * 0.45}s` }} cx={x + dx} cy={y + dy} r="9" fill="none" stroke="#E0B676" />}
              <circle className="pop" style={{ animationDelay: `${0.2 + i * 0.08}s` }} cx={x + dx} cy={y + dy} r="5" fill={p.disponibile ? '#E0B676' : '#4A615B'} stroke="#182B27" strokeWidth="2" />
            </g>
          )
        })}
      </svg>
      <span className="lbl">
        <small>In zona ora</small>
        <b>
          <Conta a={libere} ms={700} /> {libere === 1 ? 'libera' : 'libere'}
        </b>
      </span>
    </Link>
  )
}
