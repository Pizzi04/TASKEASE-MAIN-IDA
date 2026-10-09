import Link from 'next/link'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { richiediAdmin, type Db } from '@/lib/supabase/server'
import { decidiSegnalazione } from '../azioni'

export const metadata = { title: 'Segnalazioni · Amministrazione' }

// Cosa è stato segnalato, per decidere guardando il contenuto vero
async function contenuto(supabase: Db, tipo: string, id: string): Promise<{ testo: string; link?: string }> {
  const n = Number(id)
  if (tipo === 'profilo') {
    const { data } = await supabase.from('professionisti').select('bio, profili!professionisti_id_fkey!inner(nome)').eq('id', id).maybeSingle()
    return { testo: data ? `${data.profili.nome}: ${data.bio || '(nessuna presentazione)'}` : 'Profilo', link: `/professionisti/${id}` }
  }
  if (tipo === 'giudizio') {
    const { data } = await supabase.from('giudizi').select('punteggio, commento, professionista, nascosto').eq('prenotazione', n).maybeSingle()
    return { testo: data ? `${data.punteggio}/100 · “${data.commento ?? ''}”${data.nascosto ? ' (già nascosto)' : ''}` : 'Giudizio non trovato', link: data ? `/professionisti/${data.professionista}` : undefined }
  }
  if (tipo === 'post') {
    const { data } = await supabase.from('bacheca').select('titolo, dettagli, stato').eq('id', n).maybeSingle()
    return { testo: data ? `${data.titolo} — ${data.dettagli} (${data.stato})` : 'Richiesta non trovata', link: `/bacheca/${n}` }
  }
  if (tipo === 'messaggio') {
    const { data } = await supabase.from('messaggi').select('testo').eq('id', n).maybeSingle()
    return { testo: data ? `“${data.testo}”` : 'Messaggio non trovato' }
  }
  const { data } = await supabase.from('prenotazioni').select('competenza, descrizione, stato, giorno').eq('id', n).maybeSingle()
  return { testo: data ? `${data.competenza} del ${data.giorno} (${data.stato}): ${data.descrizione}` : 'Prenotazione', link: `/prenotazioni/${n}` }
}

export default async function SegnalazioniAdmin() {
  const { supabase } = await richiediAdmin()
  const [{ data: aperte }, { data: chiuse }] = await Promise.all([
    supabase.from('segnalazioni').select('*').eq('stato', 'aperta').order('creato_il').limit(50),
    supabase.from('segnalazioni').select('*').neq('stato', 'aperta').order('deciso_il', { ascending: false }).limit(20),
  ])
  const conContenuto = await Promise.all((aperte ?? []).map(async (s) => ({ s, c: await contenuto(supabase, s.oggetto_tipo, s.oggetto_id) })))

  return (
    <>
      <Testata titolo="Segnalazioni" indietro="/admin" sotto="Decidi entro 48 ore, sempre con una motivazione (DSA art. 17)" />
      {conContenuto.length === 0 && <p className="vuoto">Nessuna segnalazione da decidere.</p>}
      {conContenuto.map(({ s, c }) => (
        <article key={s.id} className="scheda">
          <header>
            <b>{s.motivo}</b> · {s.tipo === 'problema_lavoro' ? 'problema con un lavoro' : s.oggetto_tipo} · {quandoFa(s.creato_il)}
          </header>
          <p className="citazione">{c.testo}</p>
          {c.link && (
            <Link href={c.link} className="piccolo-link">
              Apri
            </Link>
          )}
          {s.testo && <p>Racconto: {s.testo}</p>}
          <Modulo azione={decidiSegnalazione} invio="Registra la decisione" className="modulo-azione">
            <input type="hidden" name="id" value={s.id} />
            <fieldset>
              <legend>Esito</legend>
              <label className="spunta">
                <input type="radio" name="esito" value="respinta" defaultChecked />
                <span>Respingi (nessuna violazione)</span>
              </label>
              <label className="spunta">
                <input type="radio" name="esito" value="accolta" />
                <span>Accogli</span>
              </label>
            </fieldset>
            <label htmlFor={`az-${s.id}`}>Azione se accolta</label>
            <select id={`az-${s.id}`} name="azione" defaultValue="nessuna">
              <option value="nessuna">Nessuna azione (richiamo)</option>
              {s.oggetto_tipo !== 'profilo' && s.oggetto_tipo !== 'prenotazione' && <option value="contenuto_nascosto">Nascondi il contenuto</option>}
              <option value="account_sospeso">Sospendi l’account segnalato</option>
            </select>
            <label htmlFor={`mo-${s.id}`}>Motivazione (la leggono chi ha segnalato e chi è segnalato)</label>
            <textarea id={`mo-${s.id}`} name="motivazione" rows={3} maxLength={1000} />
          </Modulo>
        </article>
      ))}

      {(chiuse ?? []).length > 0 && (
        <section aria-label="Decise di recente">
          <h2>Decise di recente</h2>
          {(chiuse ?? []).map((s) => (
            <p key={s.id} className="nota">
              #{s.id} {s.motivo} → {s.stato}, {s.azione}: {s.motivazione}
            </p>
          ))}
        </section>
      )}
    </>
  )
}
