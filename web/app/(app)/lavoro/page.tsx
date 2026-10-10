import Link from 'next/link'
import { NotifichePush } from '@/components/AppInstallabile'
import { redirect } from 'next/navigation'
import { EtichettaLivello, Sigillo } from '@/components/Sigillo'
import { Testata } from '@/components/Testata'
import { IDA_MIN_LAVORI } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { cambiaDisponibilita } from './azioni'

export const metadata = { title: 'Il mio lavoro · TaskEase' }

export default async function Lavoro({ searchParams }: { searchParams: Promise<{ nuova?: string }> }) {
  const { supabase, id } = await richiediProfilo()
  const { nuova } = await searchParams
  const { data: s } = await supabase.from('professionisti').select('*').eq('id', id).maybeSingle()
  if (!s) redirect('/lavoro/diventa')

  const inizioMese = new Date()
  inizioMese.setDate(1)
  const [{ data: verifica }, { count: richieste }, { count: meseLavori }, { count: daRispondere }] = await Promise.all([
    supabase.from('verifiche').select('stato, motivazione').eq('professionista', id).order('creato_il', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('prenotazioni').select('id', { count: 'exact', head: true }).eq('professionista', id).eq('stato', 'richiesta'),
    supabase
      .from('prenotazioni')
      .select('id', { count: 'exact', head: true })
      .eq('professionista', id)
      .eq('stato', 'completata')
      .gte('giorno', inizioMese.toISOString().slice(0, 10)),
    supabase.from('giudizi').select('prenotazione', { count: 'exact', head: true }).eq('professionista', id).is('risposta', null),
  ])
  const mancanti = Math.max(0, IDA_MIN_LAVORI - s.giudizi)

  return (
    <>
      <Testata titolo="Il mio lavoro" />
      {nuova && (
        <p className="conferma">
          Ci siamo. Parti da “Profilo nuovo”: l’IDA compare dopo {IDA_MIN_LAVORI} lavori giudicati. Il prossimo passo è la verifica
          dell’identità.
        </p>
      )}
      {nuova && (
        <div className="scheda">
          <p className="nota">Attiva gli avvisi sul telefono: le richieste vanno confermate in fretta.</p>
          <NotifichePush />
        </div>
      )}

      <section className="scheda riga-ida">
        <Sigillo ida={s.ida} giudizi={s.giudizi} grande />
        <div>
          <EtichettaLivello ida={s.ida} giudizi={s.giudizi} />
          <p>{mancanti > 0 ? `Ancora ${mancanti} ${mancanti === 1 ? 'giudizio' : 'giudizi'} e compare il tuo IDA.` : `IDA ${s.ida} su 100.`}</p>
          <p className="nota">
            {s.lavori} lavori in tutto · {meseLavori ?? 0} questo mese
          </p>
        </div>
      </section>

      <form action={cambiaDisponibilita} className="scheda interruttore">
        <input type="hidden" name="disponibile" value={s.disponibile ? 'no' : 'si'} />
        <div>
          <b>{s.disponibile ? 'Sei disponibile' : 'Non sei disponibile'}</b>
          <p className="nota">{s.disponibile ? 'Compari nelle ricerche e ricevi prenotazioni.' : 'Non ricevi nuove prenotazioni.'}</p>
        </div>
        <button type="submit" className="secondario" role="switch" aria-checked={s.disponibile}>
          {s.disponibile ? 'Metti in pausa' : 'Torna disponibile'}
        </button>
      </form>

      <nav className="menu" aria-label="Il mio lavoro">
        <Link href="/prenotazioni?vista=lavoro">
          Richieste e agenda {richieste ? <span className="pallino">{richieste}</span> : null}
        </Link>
        <Link href="/bacheca">Bacheca della zona</Link>
        <Link href="/lavoro/giudizi">
          Giudizi ricevuti {daRispondere ? <span className="pallino">{daRispondere}</span> : null}
        </Link>
        <Link href="/lavoro/verifica">
          Verifica identità ·{' '}
          {s.verificato ? 'fatta ✓' : verifica?.stato === 'in_attesa' ? 'in attesa' : verifica?.stato === 'respinta' ? 'non riuscita' : 'da fare'}
        </Link>
        <Link href="/lavoro/modifica">Modifica la scheda</Link>
        <Link href={`/professionisti/${id}`}>Come ti vedono i clienti</Link>
        <Link href="/legale/termini">Termini per chi lavora</Link>
      </nav>
      <p className="nota">
        Rifiutare un lavoro non abbassa l’IDA. TaskEase non prende commissioni sui tuoi lavori: i soldi sono tuoi.
      </p>
    </>
  )
}
