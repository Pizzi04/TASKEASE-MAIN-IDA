import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { MOTIVI_CONTENUTO, MOTIVI_LAVORO } from '@/lib/validazione'
import { inviaSegnalazione } from './azioni'

export const metadata = { title: 'Segnala · TaskEase' }

const COSA: Record<string, string> = {
  profilo: 'un profilo',
  giudizio: 'un giudizio',
  post: 'una richiesta in bacheca',
  messaggio: 'un messaggio',
  prenotazione: 'un problema con un lavoro',
}

export default async function Segnala({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; oggetto?: string; id?: string }>
}) {
  await richiediProfilo()
  const sp = await searchParams
  const lavoro = sp.tipo === 'problema_lavoro'
  const motivi = lavoro ? MOTIVI_LAVORO : MOTIVI_CONTENUTO

  return (
    <>
      <Testata titolo={lavoro ? 'Segnala un problema' : 'Segnala un contenuto'} sotto={`Stai segnalando ${COSA[sp.oggetto ?? ''] ?? 'qualcosa'}`} />
      <p className="nota">
        Non la pubblichiamo. La legge una persona: sentiamo anche l’altra parte, decidiamo in modo motivato e ti avvisiamo qui.
      </p>
      <Modulo azione={inviaSegnalazione} invio="Invia la segnalazione" inCorso="Invio…" tipo="pericolo">
        <input type="hidden" name="tipo" value={lavoro ? 'problema_lavoro' : 'contenuto'} />
        <input type="hidden" name="oggetto" value={sp.oggetto ?? ''} />
        <input type="hidden" name="id" value={sp.id ?? ''} />
        <fieldset>
          <legend>Cosa succede?</legend>
          {motivi.map((m) => (
            <label key={m} className="spunta">
              <input type="radio" name="motivo" value={m} />
              <span>{m}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="testo">Raccontaci (facoltativo, obbligatorio per “Altro”)</label>
        <textarea id="testo" name="testo" rows={4} maxLength={1000} placeholder="Quando, cosa, cosa ti aspettavi." />
      </Modulo>
      <p className="avviso">In caso di pericolo immediato chiama il 112. TaskEase non sostituisce le autorità.</p>
    </>
  )
}
