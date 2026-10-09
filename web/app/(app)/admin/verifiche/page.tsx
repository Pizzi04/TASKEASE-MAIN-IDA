import Link from 'next/link'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { richiediAdmin } from '@/lib/supabase/server'
import { decidiVerifica } from '../azioni'

export const metadata = { title: 'Verifiche · Amministrazione' }

export default async function VerificheAdmin() {
  const { supabase } = await richiediAdmin()
  const { data } = await supabase
    .from('verifiche')
    .select('id, professionista, preferenza, disponibilita, creato_il, professionisti!verifiche_professionista_fkey(profili!professionisti_id_fkey(nome), dati_fiscali!dati_fiscali_id_fkey(codice_fiscale, data_nascita))')
    .eq('stato', 'in_attesa')
    .order('creato_il')

  return (
    <>
      <Testata titolo="Verifiche d’identità" indietro="/admin" />
      <p className="nota">
        Guarda il documento in videochiamata o di persona. Controlla che nome, data di nascita e codice fiscale coincidano. Non fare foto
        né copie del documento.
      </p>
      {(data ?? []).length === 0 && <p className="vuoto">Nessuna verifica in attesa.</p>}
      {(data ?? []).map((v) => {
        const nome = v.professionisti?.profili?.nome ?? ''
        const f = v.professionisti?.dati_fiscali
        return (
          <article key={v.id} className="scheda">
            <header>
              <b>{nome}</b> · {v.preferenza} · chiesta {quandoFa(v.creato_il)}
            </header>
            <p>Disponibilità: {v.disponibilita}</p>
            {f && (
              <p className="nota">
                CF {f.codice_fiscale} · nato il {new Date(f.data_nascita).toLocaleDateString('it-IT')}
              </p>
            )}
            <Link className="piccolo-link" href={`/professionisti/${v.professionista}`}>
              Vedi scheda
            </Link>
            <Modulo azione={decidiVerifica} invio="Registra" className="modulo-azione">
              <input type="hidden" name="id" value={v.id} />
              <label className="spunta">
                <input type="radio" name="esito" value="verificata" defaultChecked />
                <span>Identità verificata</span>
              </label>
              <label className="spunta">
                <input type="radio" name="esito" value="respinta" />
                <span>Non riuscita</span>
              </label>
              <label className="spunta">
                <input type="checkbox" name="documento_visto" value="si" />
                <span>Ho visto un documento valido e i dati coincidono</span>
              </label>
              <label htmlFor={`m-${v.id}`}>Note (obbligatorie se non riuscita)</label>
              <input id={`m-${v.id}`} name="motivazione" type="text" maxLength={500} />
            </Modulo>
          </article>
        )
      })}
    </>
  )
}
