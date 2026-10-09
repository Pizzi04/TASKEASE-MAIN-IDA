import Image from 'next/image'
import Link from 'next/link'
import { iniziali } from './Avatar'
import { coloreDi } from '@/lib/categorie'
import { urlFoto } from '@/lib/foto'
import { LIVELLI, idaVisibile, livelloDi } from '@/lib/ida'

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

// Avatar quadrato col colore del mestiere (o la foto)
export function AvatarMestiere({ nome, foto, competenze, lato = 48, spento = false }: { nome: string; foto: string | null; competenze: readonly string[]; lato?: number; spento?: boolean }) {
  const url = urlFoto(foto)
  return (
    <span
      className="tessera-avatar"
      style={{ width: lato, height: lato, borderRadius: Math.round(lato * 0.3), background: spento ? '#4A615B' : coloreDi(competenze), fontSize: lato * 0.36 }}
      aria-hidden="true"
    >
      {url ? <Image src={url} alt="" width={lato} height={lato} sizes={`${lato}px`} /> : iniziali(nome)}
    </span>
  )
}

// Il numero IDA in chiaro, come in un registro
export function NumeroIda({ ida, giudizi }: { ida: number | null; giudizi: number }) {
  const n = idaVisibile(ida, giudizi)
  if (n == null)
    return (
      <span className="wcard-r" role="img" aria-label="Profilo nuovo: IDA non ancora calcolato">
        <span className="ida-n nuovo" aria-hidden="true">NUOVO</span>
        <span className="ida-lab" aria-hidden="true">IDA</span>
      </span>
    )
  return (
    <span className="wcard-r" role="img" aria-label={`IDA ${n} su 100, ${LIVELLI[livelloDi(ida, giudizi)].l}`}>
      <span className="ida-n" aria-hidden="true">{n}</span>
      <span className="ida-lab" aria-hidden="true">IDA</span>
    </span>
  )
}

export function RigaProfessionista({ p, indice = 0 }: { p: Professionista; indice?: number }) {
  const lv = livelloDi(p.ida, p.giudizi)
  return (
    <Link href={`/professionisti/${p.id}`} className="wcard" style={{ animationDelay: `${indice * 0.05}s` }}>
      <AvatarMestiere nome={p.nome} foto={p.foto} competenze={p.competenze} />
      <span className="wcard-b">
        <span className="wcard-n">
          {p.nome}
          {p.disponibile && (
            <>
              <span className="wcard-av" aria-hidden="true" />
              <span className="nascosto">, disponibile</span>
            </>
          )}
        </span>
        <span className="wcard-bio">{p.competenze.slice(0, 3).join(' · ')}</span>
      </span>
      <NumeroIda ida={p.ida} giudizi={p.giudizi} />
      <span className="wcard-tags">
        <span>{p.su_preventivo ? 'Su preventivo' : <><b>{p.tariffa_oraria} €</b>/h</>}</span>
        <span>
          {p.zone.slice(0, 2).join(', ')}
          {p.zone.length > 2 ? ` +${p.zone.length - 2}` : ''}
        </span>
        {lv !== 'bronzo' && <span>{LIVELLI[lv].l}</span>}
        <span>{p.tipo === 'piva' ? 'P.IVA' : 'Privato'}</span>
        {p.verificato && <span className="ok">Verificato</span>}
        {!p.disponibile && <span className="no">non disponibile</span>}
      </span>
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
