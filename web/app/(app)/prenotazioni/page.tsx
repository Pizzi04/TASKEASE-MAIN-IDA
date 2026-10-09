import Link from 'next/link'
import { Testata } from '@/components/Testata'
import { etichettaGiorno, oraBreve } from '@/lib/date'
import { STATI } from '@/lib/stati'
import { richiediProfilo } from '@/lib/supabase/server'

export const metadata = { title: 'Prenotazioni · TaskEase' }

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

  const Voce = ({ b }: { b: (typeof lista)[number] }) => {
    const altro = comePro ? b.cliente?.nome : b.professionisti?.profili?.nome
    const daGiudicare = !comePro && b.stato === 'completata' && !b.giudizi
    return (
      <Link href={`/prenotazioni/${b.id}`} className="scheda link-scheda">
        <b>
          {etichettaGiorno(b.giorno)} alle {oraBreve(b.ora)}
        </b>
        <span>
          {b.competenza} · {altro ?? '—'} · {b.zona}
        </span>
        <span className={b.stato === 'confermata' || b.stato === 'completata' ? 'stato ok' : 'stato'}>
          {b.stato === 'richiesta' && b.controproposta ? 'Nuovo orario proposto' : STATI[b.stato]}
          {daGiudicare && ' · Lascia il giudizio'}
          {b.giudizi && ` · IDA ${b.giudizi.punteggio}`}
        </span>
      </Link>
    )
  }

  return (
    <>
      <Testata titolo="Prenotazioni" />
      {scheda && (
        <div className="ruolo" role="tablist" aria-label="Quali prenotazioni">
          <Link href="/prenotazioni?vista=cliente" role="tab" aria-selected={!comePro}>
            Quelle che ho fatto
          </Link>
          <Link href="/prenotazioni?vista=lavoro" role="tab" aria-selected={comePro}>
            Il mio lavoro
          </Link>
        </div>
      )}
      <section aria-label="In corso">
        <h2>In corso</h2>
        {attive.length === 0 ? (
          <p className="vuoto">
            Niente in corso.{' '}
            {!comePro && <Link href="/cerca">Trova chi ti serve</Link>}
          </p>
        ) : (
          attive.map((b) => <Voce key={b.id} b={b} />)
        )}
      </section>
      {altre.length > 0 && (
        <section aria-label="Storico">
          <h2>Storico</h2>
          {altre.map((b) => (
            <Voce key={b.id} b={b} />
          ))}
        </section>
      )}
    </>
  )
}
