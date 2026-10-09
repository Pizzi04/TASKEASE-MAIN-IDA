import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { diventaProfessionista } from '../azioni'
import { CampiScheda } from '../campi-scheda'

export const metadata = { title: 'Inizia a lavorare · TaskEase' }

export default async function Diventa() {
  const { supabase, id, profilo } = await richiediProfilo()
  const { data } = await supabase.from('professionisti').select('id').eq('id', id).maybeSingle()
  if (data) redirect('/lavoro')

  return (
    <>
      <Testata titolo="Inizia a lavorare" indietro="/" sotto={`Come ${profilo.nome}`} />
      <p className="nota">
        Decidi tu prezzi, orari, zone e quali lavori accettare. TaskEase mette in contatto, non è il datore di lavoro di nessuno.
      </p>
      <Modulo azione={diventaProfessionista} invio="Crea la mia scheda" inCorso="Creo la scheda…">
        <CampiScheda />

        <fieldset>
          <legend>Dati per la legge (non pubblici)</legend>
          <p className="nota">
            Servono per la comunicazione fiscale delle piattaforme (DAC7). Li vediamo solo noi e, quando dovuto, l’Agenzia delle Entrate.
          </p>
          <label htmlFor="codice_fiscale">Codice fiscale</label>
          <input id="codice_fiscale" name="codice_fiscale" type="text" maxLength={16} autoCapitalize="characters" autoComplete="off" required />
          <label htmlFor="data_nascita">Data di nascita</label>
          <input id="data_nascita" name="data_nascita" type="date" required />
          <label htmlFor="residenza">Indirizzo di residenza</label>
          <input id="residenza" name="residenza" type="text" maxLength={200} autoComplete="street-address" required />
          <label className="spunta">
            <input type="checkbox" name="dichiarazione_fiscale" value="si" />
            <span>Dichiaro i redditi che guadagno con TaskEase come prevede la legge (prestazione occasionale o Partita IVA).</span>
          </label>
          <label className="spunta">
            <input type="checkbox" name="termini" value="si" />
            <span>
              Accetto i <Link href="/legale/termini">Termini</Link> per chi lavora e ho letto l’<Link href="/legale/privacy">informativa privacy</Link>.
            </span>
          </label>
        </fieldset>
      </Modulo>
    </>
  )
}
