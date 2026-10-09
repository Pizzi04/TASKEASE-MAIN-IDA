import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { MOTIVI_USCITA } from '@/lib/validazione'
import { eliminaAccount } from '../azioni'

export const metadata = { title: 'Elimina l’account · TaskEase' }

export default async function Elimina() {
  const { supabase, id } = await richiediProfilo()
  const { count } = await supabase
    .from('prenotazioni')
    .select('id', { count: 'exact', head: true })
    .or(`cliente.eq.${id},professionista.eq.${id}`)
    .in('stato', ['richiesta', 'confermata'])

  return (
    <>
      <Testata titolo="Elimina l’account" indietro="/profilo" />
      <p>
        Cancelliamo profilo, scheda, prenotazioni, messaggi, preferiti e foto. I giudizi che hai lasciato restano senza il tuo nome. I dati
        fiscali che la legge ci obbliga a tenere li conserviamo solo per il tempo previsto.
      </p>
      <p className="nota">Se vuoi solo sparire per un po’, metti il profilo in pausa da Profilo.</p>
      {count ? (
        <p className="avviso">
          Hai {count} {count === 1 ? 'prenotazione attiva' : 'prenotazioni attive'}: verranno annullate e avviseremo l’altra persona.
        </p>
      ) : null}
      <Modulo azione={eliminaAccount} invio="Elimina definitivamente" inCorso="Elimino…" tipo="pericolo">
        <label htmlFor="motivo">Perché te ne vai? (facoltativo, anonimo)</label>
        <select id="motivo" name="motivo" defaultValue="">
          <option value="">Preferisco non dirlo</option>
          {MOTIVI_USCITA.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <label htmlFor="conferma">Scrivi ELIMINA per confermare</label>
        <input id="conferma" name="conferma" type="text" autoComplete="off" autoCapitalize="characters" />
      </Modulo>
    </>
  )
}
