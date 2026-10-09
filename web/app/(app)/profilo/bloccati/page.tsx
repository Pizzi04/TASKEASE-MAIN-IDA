import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { sblocca } from '../azioni'

export const metadata = { title: 'Persone bloccate · TaskEase' }

export default async function Bloccati() {
  const { supabase, id } = await richiediProfilo()
  const { data } = await supabase.from('blocchi').select('bloccato, creato_il, profili!blocchi_bloccato_fkey(nome)').eq('utente', id)
  return (
    <>
      <Testata titolo="Persone bloccate" indietro="/profilo" />
      <p className="nota">Chi blocchi non ti vede in bacheca, non può prenotarti né scriverti, e tu non lo vedi nelle ricerche.</p>
      {(data ?? []).length === 0 && <p className="vuoto">Non hai bloccato nessuno.</p>}
      {(data ?? []).map((b) => (
        <form key={b.bloccato} action={sblocca} className="scheda interruttore">
          <input type="hidden" name="utente" value={b.bloccato} />
          <span>{b.profili?.nome ?? 'Utente'}</span>
          <button className="secondario" type="submit">
            Sblocca
          </button>
        </form>
      ))}
    </>
  )
}
