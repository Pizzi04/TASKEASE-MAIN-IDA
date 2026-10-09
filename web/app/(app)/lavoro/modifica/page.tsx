import { redirect } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { aggiornaResidenza, modificaScheda } from '../azioni'
import { CampiScheda } from '../campi-scheda'

export const metadata = { title: 'Modifica la scheda · TaskEase' }

export default async function Modifica() {
  const { supabase, id } = await richiediProfilo()
  const [{ data: s }, { data: f }] = await Promise.all([
    supabase.from('professionisti').select('*').eq('id', id).maybeSingle(),
    supabase.from('dati_fiscali').select('codice_fiscale, data_nascita, residenza').eq('id', id).maybeSingle(),
  ])
  if (!s) redirect('/lavoro/diventa')

  return (
    <>
      <Testata titolo="Modifica la scheda" indietro="/lavoro" />
      <Modulo azione={modificaScheda} invio="Salva" inCorso="Salvo…">
        <CampiScheda v={s} />
      </Modulo>
      {f && (
        <Modulo azione={aggiornaResidenza} invio="Aggiorna la residenza" tipo="secondario">
          <h2>Dati per la legge</h2>
          <p className="nota">
            Codice fiscale {f.codice_fiscale} · nato il {new Date(f.data_nascita).toLocaleDateString('it-IT')}. Per correggerli scrivi
            all’assistenza.
          </p>
          <label htmlFor="residenza">Residenza</label>
          <input id="residenza" name="residenza" type="text" maxLength={200} defaultValue={f.residenza} />
        </Modulo>
      )}
    </>
  )
}
