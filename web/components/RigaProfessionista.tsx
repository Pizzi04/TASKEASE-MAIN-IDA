import Link from 'next/link'
import { Avatar } from './Avatar'
import { EtichettaLivello, Sigillo } from './Sigillo'

export type Professionista = {
  id: string
  nome: string
  foto: string | null
  competenze: string[]
  zone: string[]
  tariffa_oraria: number
  su_preventivo: boolean
  tipo: string
  verificato: boolean
  disponibile: boolean
  ida: number | null
  giudizi: number
  lavori: number
}

export function RigaProfessionista({ p }: { p: Professionista }) {
  return (
    <Link href={`/professionisti/${p.id}`} className="riga-pro">
      <Avatar nome={p.nome} foto={p.foto} />
      <span className="riga-pro-testo">
        <span className="riga-pro-nome">
          {p.nome}
          {p.verificato && (
            <span className="badge-ok" title="Identità verificata">
              ✓ verificato
            </span>
          )}
        </span>
        <span className="riga-pro-sotto">{p.competenze.slice(0, 3).join(' · ')}</span>
        <span className="riga-pro-sotto">
          {p.su_preventivo ? 'Su preventivo' : `${p.tariffa_oraria} €/ora`} · {p.zone.slice(0, 2).join(', ')}
          {p.zone.length > 2 ? ` +${p.zone.length - 2}` : ''} · {p.tipo === 'piva' ? 'P.IVA' : 'Privato'}
        </span>
        <EtichettaLivello ida={p.ida} giudizi={p.giudizi} />
        {!p.disponibile && <span className="etichetta spento">Ora non disponibile</span>}
      </span>
      <Sigillo ida={p.ida} giudizi={p.giudizi} />
    </Link>
  )
}

// Colonne da chiedere al database per costruire una riga
export const COLONNE_PRO =
  'id, competenze, zone, tariffa_oraria, su_preventivo, tipo, verificato, disponibile, ida, giudizi, lavori, profili!professionisti_id_fkey!inner(nome, foto, in_pausa)'

type RigaDb = {
  id: string
  competenze: string[]
  zone: string[]
  tariffa_oraria: number
  su_preventivo: boolean
  tipo: string
  verificato: boolean
  disponibile: boolean
  ida: number | null
  giudizi: number
  lavori: number
  profili: { nome: string; foto: string | null; in_pausa: boolean }
}

export function daRiga(r: RigaDb): Professionista & { in_pausa: boolean } {
  const { profili, ...resto } = r
  return { ...resto, nome: profili.nome, foto: profili.foto, in_pausa: profili.in_pausa }
}
