import { redirect } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { chiediVerifica } from '../azioni'

export const metadata = { title: 'Verifica identità · TaskEase' }

export default async function Verifica() {
  const { supabase, id } = await richiediProfilo()
  const [{ data: s }, { data: ultima }] = await Promise.all([
    supabase.from('professionisti').select('verificato').eq('id', id).maybeSingle(),
    supabase
      .from('verifiche')
      .select('stato, preferenza, disponibilita, motivazione, creato_il')
      .eq('professionista', id)
      .order('creato_il', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (!s) redirect('/lavoro/diventa')

  return (
    <>
      <Testata titolo="Verifica dell’identità" indietro="/lavoro" />
      <p>
        La facciamo di persona o in videochiamata guardando il tuo documento. <b>Non conserviamo copie</b>: salviamo solo che la verifica è
        avvenuta e quando. Dopo, sul tuo profilo compare “Identità verificata”.
      </p>
      {s.verificato ? (
        <p className="conferma">Fatta ✓ Il badge è sul tuo profilo.</p>
      ) : ultima?.stato === 'in_attesa' ? (
        <p className="avviso">
          Richiesta inviata il {new Date(ultima.creato_il).toLocaleDateString('it-IT')} ({ultima.preferenza}, {ultima.disponibilita}). Ti
          contattiamo per fissare l’appuntamento.
        </p>
      ) : (
        <>
          {ultima?.stato === 'respinta' && (
            <p className="avviso">L’ultima verifica non è riuscita{ultima.motivazione ? `: ${ultima.motivazione}` : '.'} Puoi richiederla di nuovo.</p>
          )}
          <Modulo azione={chiediVerifica} invio="Chiedi la verifica" inCorso="Invio…">
            <fieldset>
              <legend>Come preferisci</legend>
              <label className="spunta">
                <input type="radio" name="preferenza" value="videochiamata" defaultChecked />
                <span>Videochiamata (10 minuti)</span>
              </label>
              <label className="spunta">
                <input type="radio" name="preferenza" value="di persona" />
                <span>Di persona, a Forlì</span>
              </label>
            </fieldset>
            <label htmlFor="disponibilita">Quando sei disponibile?</label>
            <input id="disponibilita" name="disponibilita" type="text" maxLength={200} placeholder="Es. sera dopo le 18, sabato mattina" />
            <p className="nota">Tieni pronto un documento d’identità valido.</p>
          </Modulo>
        </>
      )}
    </>
  )
}
