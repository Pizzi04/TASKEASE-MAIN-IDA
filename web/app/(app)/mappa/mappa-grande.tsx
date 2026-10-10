'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Icona } from '@/components/Icona'
import { iniziali } from '@/components/Avatar'
import { coloreDi } from '@/lib/categorie'
import { QUARTIERI } from '@/lib/zone'

export type PersonaMappa = {
  id: string
  nome: string
  competenze: string[]
  zona: string
  disponibile: boolean
  ida: number | null
  tariffa: number
  preventivo: boolean
}

const MW = 390
const MH = 560
const pos = (z: string): [number, number] => {
  const q = QUARTIERI[z]
  return [(q.x / 100) * MW, (q.y / 100) * MH]
}

// Mappa schematica dei quartieri (non una cartina vera): chi lavora, dove, e chi è libero adesso.
// Si sposta trascinando, si ingrandisce con i pulsanti, un tocco su una persona apre la sua scheda.
export function MappaGrande({ persone, mia, categorie }: { persone: PersonaMappa[]; mia: string; categorie: string[] }) {
  const [filtro, setFiltro] = useState('tutti')
  const [sel, setSel] = useState<string | null>(null)
  const [vista, setVista] = useState({ s: 1, x: 0, y: 0 })
  const trascina = useRef<{ px: number; py: number; x: number; y: number; mosso: boolean } | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  const visibili = persone.filter((p) => (filtro === 'tutti' ? true : filtro === 'liberi' ? p.disponibile : p.competenze.includes(filtro)))
  const liberi = visibili.filter((p) => p.disponibile).length
  const posPersona = (p: PersonaMappa): [number, number] => {
    const [cx, cy] = pos(p.zona)
    const vicini = visibili.filter((v) => v.zona === p.zona)
    const i = vicini.indexOf(p)
    if (vicini.length < 2) return [cx, cy]
    // Anelli concentrici: ognuno ospita quanti puntini ci stanno senza sovrapporsi troppo
    let resto = i
    for (let r = 20; ; r += 20) {
      const posti = Math.min(Math.floor((2 * Math.PI * r) / 32), vicini.length - (i - resto))
      if (resto < posti) {
        const a = (resto / posti) * Math.PI * 2 - Math.PI / 2 + r / 40
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
      }
      resto -= posti
    }
  }
  const vbW = MW / vista.s
  const vbH = MH / vista.s
  const limita = (v: { s: number; x: number; y: number }) => ({ ...v, x: Math.min(Math.max(v.x, 0), MW - MW / v.s), y: Math.min(Math.max(v.y, 0), MH - MH / v.s) })
  const zoom = (f: number) =>
    setVista((v) => {
      const s = Math.min(3, Math.max(1, v.s * f))
      const cx = v.x + MW / v.s / 2
      const cy = v.y + MH / v.s / 2
      return limita({ s, x: cx - MW / s / 2, y: cy - MH / s / 2 })
    })
  const centra = (p: PersonaMappa) => {
    const [x, y] = posPersona(p)
    setVista((v) => {
      const s = Math.max(v.s, 1.6)
      return limita({ s, x: x - MW / s / 2, y: y - MH / s / 2.6 })
    })
  }
  const giu = (e: React.PointerEvent) => {
    trascina.current = { px: e.clientX, py: e.clientY, x: vista.x, y: vista.y, mosso: false }
  }
  const muovi = (e: React.PointerEvent) => {
    const t = trascina.current
    if (!t || vista.s === 1 || !svg.current) return
    const r = svg.current.getBoundingClientRect()
    const dx = ((e.clientX - t.px) / r.width) * vbW
    const dy = ((e.clientY - t.py) / r.height) * vbH
    if (Math.abs(e.clientX - t.px) + Math.abs(e.clientY - t.py) > 6) t.mosso = true
    setVista((v) => limita({ ...v, x: t.x - dx, y: t.y - dy }))
  }
  const su = () => {
    setTimeout(() => {
      trascina.current = null
    }, 0)
  }
  const scegli = (p: PersonaMappa) => {
    if (trascina.current?.mosso) return
    setSel(p.id)
    centra(p)
  }
  const w = sel ? persone.find((p) => p.id === sel) : null
  const scheda = useRef<HTMLDivElement>(null)
  const daDove = useRef<string | null>(null)
  // Aprendo una scheda il fuoco ci entra; chiudendola torna sul puntino da cui si era partiti
  useEffect(() => {
    if (sel) {
      daDove.current = sel
      scheda.current?.focus()
    } else if (daDove.current) {
      svg.current?.querySelector<SVGGElement>(`g.pin[data-id="${daDove.current}"]`)?.focus()
      daDove.current = null
    }
  }, [sel])
  const qMia = QUARTIERI[mia] ? pos(mia) : null

  return (
    <div className="mappa-pagina">
      <div className="cats" role="group" aria-label="Filtra">
        {[['tutti', 'Tutti'], ['liberi', 'Liberi ora'], ...categorie.map((c) => [c, c])].map(([k, l]) => (
          <button
            type="button"
            key={k}
            className="cat2"
            aria-pressed={filtro === k}
            onClick={() => {
              setFiltro(k)
              setSel(null)
              setVista({ s: 1, x: 0, y: 0 })
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <p className="cerca-meta">
        <b>
          {visibili.length} {visibili.length === 1 ? 'persona' : 'persone'}
        </b>{' '}
        · {liberi} {liberi === 1 ? 'libera' : 'libere'} ora · la posizione è quella della zona, mai dell’indirizzo
      </p>
      <div className="mappa-g">
        <svg
          ref={svg}
          data-mappa={`${MW} ${MH}`}
          viewBox={`${vista.x} ${vista.y} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label={`Mappa dei quartieri di Forlì con ${visibili.length} persone`}
          onPointerDown={giu}
          onPointerMove={muovi}
          onPointerUp={su}
          onPointerLeave={su}
          style={{ cursor: vista.s > 1 ? 'grab' : 'default', touchAction: vista.s > 1 ? 'none' : 'pan-y' }}
        >
          <rect x="-400" y="-400" width={MW + 800} height={MH + 800} fill="#10211D" />
          <path d="M-20 120 C 80 150, 140 90, 210 170 S 300 330, 420 300" fill="none" stroke="#173A4A" strokeWidth="16" strokeLinecap="round" />
          <g fill="none" stroke="#21403A" strokeWidth="7" strokeLinecap="round">
            <path d="M-20 260 C 100 240, 250 280, 420 230" />
            <path d="M190 -20 L 205 600" />
            <path d="M40 -20 C 90 200, 60 380, 120 600" />
          </g>
          <g fill="none" stroke="#1A332E" strokeWidth="3" strokeLinecap="round">
            <path d="M-20 70 L 420 40" />
            <path d="M-20 420 L 420 450" />
            <path d="M320 -20 L 300 600" />
            <path d="M-20 520 C 150 500, 260 540, 420 510" />
          </g>
          {Object.keys(QUARTIERI).map((z) => {
            const [x, y] = pos(z)
            const n = visibili.filter((v) => v.zona === z).length
            return (
              <g key={z}>
                <circle cx={x} cy={y} r="52" fill={n ? 'rgba(36,94,83,.28)' : 'rgba(36,94,83,.12)'} stroke={n ? '#2F6F62' : '#21403A'} strokeDasharray={n ? 'none' : '4 5'} />
                <text x={x} y={y + 68} textAnchor="middle" fontSize="12" fontWeight="700" fill={n ? '#C4CEC9' : '#9DB0A9'}>
                  {z}
                  {n ? ` · ${n}` : ''}
                </text>
              </g>
            )
          })}
          {qMia && (
            <g aria-hidden="true">
              <circle className="giro" cx={qMia[0]} cy={qMia[1]} r="62" fill="none" stroke="#4FD1A0" strokeWidth="1.5" strokeDasharray="4 5" />
              <text x={qMia[0]} y={qMia[1] - 66} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#4FD1A0">
                la tua zona
              </text>
            </g>
          )}
          {visibili.map((p, i) => {
            const [x, y] = posPersona(p)
            const on = sel === p.id
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={`${p.nome}, ${p.competenze.slice(0, 2).join(', ')}, ${p.disponibile ? 'libero ora' : 'non disponibile'}${p.ida != null ? `, IDA ${p.ida}` : ''}`}
                aria-pressed={on}
                className="pin"
                style={{ animationDelay: `${i * 0.06}s` }}
                data-id={p.id}
                data-nome={p.nome}
                data-competenze={p.competenze.join('|')}
                data-libero={p.disponibile ? '1' : '0'}
                data-ida={p.ida ?? ''}
                data-tariffa={p.preventivo ? '' : p.tariffa}
                data-zona={p.zona}
                data-x={x}
                data-y={y}
                onClick={() => scegli(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSel(p.id)
                    centra(p)
                  }
                }}
              >
                {p.disponibile && <circle className="onda" style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy={y} r="22" fill="none" stroke="#E0B676" />}
                {on && <circle cx={x} cy={y} r="24" fill="none" stroke="#E0B676" strokeWidth="3" />}
                <circle cx={x} cy={y} r="18" fill={p.disponibile ? coloreDi(p.competenze) : '#4A615B'} stroke="#0E1C19" strokeWidth="2.5" />
                <text x={x} y={y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#0E1C19">
                  {iniziali(p.nome)}
                </text>
              </g>
            )
          })}
        </svg>
        {!w && (
          <div className="mappa-zoom">
            <button type="button" aria-label="Ingrandisci" onClick={() => zoom(1.5)} disabled={vista.s >= 3}>
              <Icona nome="plus" lato={20} />
            </button>
            <button type="button" aria-label="Rimpicciolisci" onClick={() => zoom(1 / 1.5)} disabled={vista.s <= 1}>
              <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>
                −
              </span>
            </button>
            <button
              type="button"
              aria-label="Mostra tutta la mappa"
              onClick={() => {
                setVista({ s: 1, x: 0, y: 0 })
                setSel(null)
              }}
            >
              <Icona nome="compass" lato={19} />
            </button>
          </div>
        )}
        {visibili.length === 0 && (
          <div className="mappa-vuota">
            {filtro === 'tutti' ? (
              'Ancora nessuno sulla mappa: chi lavora in zona comparirà qui.'
            ) : (
              <>
                Nessuno {filtro === 'liberi' ? 'libero adesso' : `per ${filtro}`} sulla mappa.{' '}
                <button type="button" className="pulsante-testo collegamento" onClick={() => setFiltro('tutti')}>
                  Mostra tutti
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {w ? (
        <div
          className="mappa-scheda"
          role="dialog"
          aria-label={`Scheda di ${w.nome}`}
          ref={scheda}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSel(null)
          }}
        >
          <div className="mappa-scheda-testa">
            <span className="tessera-avatar" style={{ background: w.disponibile ? coloreDi(w.competenze) : '#4A615B' }} aria-hidden="true">
              {iniziali(w.nome)}
            </span>
            <div>
              <div className="wcard-n">
                {w.nome}
                {w.disponibile && <span className="wcard-av" aria-hidden="true" />}
              </div>
              <div className="wcard-bio">{w.competenze.slice(0, 3).join(' · ')}</div>
            </div>
            <span className="wcard-r">
              {w.ida != null ? <span className="ida-n">{w.ida}</span> : <span className="ida-n nuovo">NUOVO</span>}
              <span className="ida-lab">IDA</span>
            </span>
            <button type="button" className="indietro" aria-label="Chiudi la scheda" onClick={() => setSel(null)}>
              <Icona nome="x" lato={18} />
            </button>
          </div>
          <div className="wcard-tags">
            <span>{w.preventivo ? 'Su preventivo' : <><b>{w.tariffa} €</b>/h</>}</span>
            <span>{w.zona}</span>
            {w.disponibile ? <span className="ok">libero ora</span> : <span className="no">non disponibile</span>}
          </div>
          <div className="azioni-due">
            <Link href={`/professionisti/${w.id}`} className="bottone fantasma">
              Vedi profilo
            </Link>
            {w.disponibile && (
              <Link href={`/professionisti/${w.id}/prenota`} className="bottone">
                Prenota {w.nome.split(' ')[0]}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="nota centro">
          Tocca una persona per vedere la sua scheda. <Link href="/cerca">Preferisci l’elenco?</Link>
        </p>
      )}
    </div>
  )
}
