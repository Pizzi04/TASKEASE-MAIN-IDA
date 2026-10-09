import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediAdmin } from '@/lib/supabase/server'
import { riattiva } from '../azioni'

export const metadata = { title: 'Account sospesi · Amministrazione' }

export default async function Sospesi() {
  const { supabase } = await richiediAdmin()
  const { data } = await supabase.rpc('account_sospesi')
  return (
    <>
      <Testata titolo="Account sospesi" indietro="/admin" />
      {(data ?? []).length === 0 && <p className="vuoto">Nessun account sospeso.</p>}
      {(data ?? []).map((p) => (
        <article key={p.id} className="scheda">
          <b>{p.nome}</b> · {p.zona} · dal {new Date(p.aggiornato_il).toLocaleDateString('it-IT')}
          <Modulo azione={riattiva} invio="Riattiva" tipo="secondario" className="modulo-azione">
            <input type="hidden" name="utente" value={p.id} />
            <label htmlFor={`r-${p.id}`}>Motivazione (la legge l’utente)</label>
            <input id={`r-${p.id}`} name="motivazione" type="text" maxLength={300} />
          </Modulo>
        </article>
      ))}
    </>
  )
}
