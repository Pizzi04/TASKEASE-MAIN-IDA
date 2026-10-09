import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { VOCI } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { lasciaGiudizio } from '../../azioni'

export const metadata = { title: 'Giudizio · TaskEase' }

const DOMANDE: Record<string, string> = {
  puntualita: 'È arrivato quando aveva detto?',
  qualita: 'Il lavoro è fatto bene?',
  parola: 'Ha rispettato prezzo e accordi?',
  pulizia: 'Ha lasciato tutto in ordine?',
  comunicazione: 'Si è fatto capire e ha risposto?',
}

export default async function Giudizio({ params }: { params: Promise<{ id: string }> }) {
  const { id: idTesto } = await params
  const { supabase, id } = await richiediProfilo()
  const pid = Number(idTesto)
  const { data: b } = await supabase
    .from('prenotazioni')
    .select('id, stato, competenza, cliente, professionisti!prenotazioni_professionista_fkey(profili!professionisti_id_fkey(nome)), giudizi!giudizi_prenotazione_fkey(prenotazione)')
    .eq('id', pid)
    .maybeSingle()
  if (!b || b.cliente !== id) notFound()
  if (b.stato !== 'completata' || b.giudizi) redirect(`/prenotazioni/${pid}`)
  const nome = (b.professionisti?.profili?.nome ?? '').split(' ')[0]

  return (
    <>
      <Testata titolo={`Com’è andata con ${nome}?`} indietro={`/prenotazioni/${pid}`} sotto={b.competenza} />
      <p className="nota">
        Cinque domande da 1 (male) a 5 (benissimo). Diventano un voto da 20 a 100 che entra nell’IDA di {nome}.{' '}
        <Link href="/legale/giudizi">Come si calcola</Link>
      </p>
      <Modulo azione={lasciaGiudizio} invio="Invia il giudizio" inCorso="Invio…">
        <input type="hidden" name="prenotazione" value={pid} />
        {VOCI.map((v) => (
          <fieldset key={v.k} className="stelle">
            <legend>
              {v.l} <small>({Math.round(v.peso * 100)}%)</small>
            </legend>
            <p className="nota">{DOMANDE[v.k]}</p>
            <div className="scala">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input type="radio" name={v.k} value={n} required />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label htmlFor="commento">Due parole per chi verrà dopo (facoltativo)</label>
        <textarea id="commento" name="commento" rows={3} maxLength={500} placeholder="Cosa è andato bene, cosa no." />
        <p className="nota">Si vede con il tuo nome e l’iniziale del cognome. {nome} potrà rispondere una volta.</p>
      </Modulo>
    </>
  )
}
