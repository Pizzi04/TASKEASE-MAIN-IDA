import Link from 'next/link'
import { Icona } from '@/components/Icona'
import { Testata } from '@/components/Testata'
import { etichettaGiorno, oraBreve } from '@/lib/date'
import { STATI } from '@/lib/stati'
import { richiediProfilo } from '@/lib/supabase/server'

export const metadata = { title: 'Prenotazioni · TaskEase' }

type VoceLista = {
  id: number
  giorno: string
  ora: string
  stato: string
  competenza: string
  controproposta: boolean
  zona: string
  cliente: { nome: string } | null
  professionisti: { profili: { nome: string } | null } | null
  giudizi: { punteggio: number | null } | null
}

function Voce({ b, comePro, indice }: { b: VoceLista; comePro: boolean; indice: number }) {
  const altro = comePro ? b.cliente?.nome : b.professionisti?.profili?.nome
  const daGiudicare = !comePro && b.stato === 'completata' && !b.giudizi
  const viva = b.stato === 'richiesta' || b.stato === 'confermata'
  return (
    <Link href={`/prenotazioni/${b.id}`} className={viva ? 'pren' : 'pren chiusa'} style={{ animationDelay: `${Math.min(indice, 10) * 0.04}s` }}>
      <span className="pren-ora">
        <b>{oraBreve(b.ora)}</b>
        <small>{etichettaGiorno(b.giorno)}</small>
      </span>
      <span className="pren-b">
        <span className="pren-t">{b.competenza}</span>
        <span className="pren-s">
          {altro ?? '—'} · {b.zona}
        </span>
        <span className={b.stato === 'confermata' || b.stato === 'completata' ? 'pren-stato ok' : b.stato === 'richiesta' ? 'pren-stato' : 'pren-stato spento'}>
          {b.stato === 'richiesta' && b.controproposta ? 'Nuovo orario proposto' : STATI[b.stato]}
          {daGiudicare && ' · lascia il giudizio'}
          {b.giudizi && ` · IDA ${b.giudizi.punteggio}`}
        </span>
      </span>
      <Icona nome="arrowR" lato={18} />
    </Link>
  )
}

export default async function Prenotazioni({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { supabase, id, profilo } = await richiediProfilo()
  const { vista } = await searchParams
  const { data: scheda } = await supabase.from('professionisti').select('id').eq('id', id).maybeSingle()
  const comePro = !!scheda && (vista === 'lavoro' || (vista !== 'cliente' && profilo.ruolo === 'worker'))

  const { data } = await supabase
    .from('prenotazioni')
    .select(
      'id, giorno, ora, stato, competenza, controproposta, zona, cliente:profili!prenotazioni_cliente_fkey(nome), professionisti!prenotazioni_professionista_fkey(profili!professionisti_id_fkey(nome)), giudizi!giudizi_prenotazione_fkey(punteggio)',
    )
    .eq(comePro ? 'professionista' : 'cliente', id)
    .order('giorno', { ascending: false })
    .order('ora', { ascending: false })
    .limit(200)

  const lista = data ?? []
  const attive = lista.filter((b) => b.stato === 'richiesta' || b.stato === 'confermata').reverse()
  const altre = lista.filter((b) => b.stato !== 'richiesta' && b.stato !== 'confermata')

  return (
    <>
      <Testata titolo="Prenotazioni" indietro="/profilo" />
      {scheda && (
        <div className="ruolo largo" role="tablist" aria-label="Quali prenotazioni">
          <Link href="/prenotazioni?vista=cliente" role="tab" aria-selected={!comePro}>
            Quelle che ho fatto
          </Link>
          <Link href="/prenotazioni?vista=lavoro" role="tab" aria-selected={comePro}>
            Il mio lavoro
          </Link>
        </div>
      )}
      <section aria-label="In corso">
        <div className="sec-h"><h2>In corso</h2></div>
        {attive.length === 0 ? (
          <p className="vuoto">
            Niente in corso.{' '}
            {!comePro && <Link href="/cerca">Trova chi ti serve</Link>}
          </p>
        ) : (
          <div className="wlist">{attive.map((b, i) => <Voce key={b.id} b={b} comePro={comePro} indice={i} />)}</div>
        )}
      </section>
      {altre.length > 0 && (
        <section aria-label="Storico">
          <div className="sec-h"><h2>Storico</h2></div>
          <div className="wlist">
            {altre.map((b, i) => (
              <Voce key={b.id} b={b} comePro={comePro} indice={i} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
