'use client'

import { Conta } from './Conta'

// Il sigillo IDA dell'ingresso: l'anello si disegna e il numero sale (una volta, mai con "riduci movimento")
export function SigilloEroe({ valore = 96, lato = 92 }: { valore?: number; lato?: number }) {
  const r = 46
  const giro = +(2 * Math.PI * r).toFixed(2)
  const puntini = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    return <circle key={i} cx={60 + Math.cos(a) * 54} cy={60 + Math.sin(a) * 54} r="0.9" fill="#E6BE80" opacity=".5" />
  })
  return (
    <div className="seal-hero" style={{ width: lato, height: lato }} role="img" aria-label={`Esempio di sigillo IDA: ${valore} su 100`}>
      <svg viewBox="0 0 120 120" width={lato} height={lato} aria-hidden="true">
        <circle cx="60" cy="60" r="58" fill="none" stroke="#E6BE80" strokeOpacity=".16" strokeWidth="1" />
        <g className="seal-dots">{puntini}</g>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E6BE80" strokeOpacity=".18" strokeWidth="3" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#E6BE80"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={giro}
          className="seal-draw"
          style={{ '--c': giro } as React.CSSProperties}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="seal-hero-in" aria-hidden="true">
        <span className="seal-num">
          <Conta a={valore} ms={1300} />
        </span>
        <span className="seal-lab">IDA</span>
      </div>
    </div>
  )
}
