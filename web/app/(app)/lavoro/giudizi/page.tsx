import { redirect } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { richiediProfilo } from '@/lib/supabase/server'
import { rispondiGiudizio } from '../../professionisti/[id]/azioni'

export const metadata = { title: 'Giudizi ricevuti · TaskEase' }

export default async function GiudiziRicevuti() {
  const { supabase, id } = await richiediProfilo()
  const { data: s } = await supabase.from('professionisti').select('id').eq('id', id).maybeSingle()
  if (!s) redirect('/lavoro/diventa')
  const { data: giudizi } = await supabase.rpc('giudizi_di', { p_professionista: id })

  return (
    <>
      <Testata titolo="Giudizi ricevuti" indietro="/lavoro" />
      <p className="nota">Puoi rispondere una volta a ogni giudizio. La risposta è pubblica, sotto al giudizio.</p>
      {(giudizi ?? []).length === 0 && <p className="vuoto">Ancora nessun giudizio.</p>}
      {(giudizi ?? []).map((g) => (
        <article key={g.prenotazione} className="scheda giudizio">
          <header>
            <b>{g.autore}</b> · {g.competenza} · {quandoFa(g.creato_il)}
            <span className="punteggio">{g.punteggio}</span>
          </header>
          {g.commento && <p>{g.commento}</p>}
          {g.risposta ? (
            <p className="risposta">
              <b>La tua risposta:</b> {g.risposta}
            </p>
          ) : (
            <Modulo azione={rispondiGiudizio} invio="Pubblica la risposta" tipo="secondario" className="modulo-azione">
              <input type="hidden" name="prenotazione" value={g.prenotazione} />
              <label htmlFor={`r-${g.prenotazione}`}>La tua risposta</label>
              <textarea id={`r-${g.prenotazione}`} name="risposta" rows={2} maxLength={500} />
            </Modulo>
          )}
        </article>
      ))}
    </>
  )
}
