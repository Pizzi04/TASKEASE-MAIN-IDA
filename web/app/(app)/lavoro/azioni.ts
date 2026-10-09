'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { StatoAzione } from '@/components/Modulo'
import { controlla, messaggioDb } from '@/lib/errori'
import { registra } from '@/lib/eventi'
import { richiediProfilo } from '@/lib/supabase/server'
import { VERSIONE_DOCUMENTI, leggiDatiFiscali, leggiScheda } from '@/lib/validazione'

export async function diventaProfessionista(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, profilo } = await richiediProfilo()
  if (profilo.sospeso) return { errore: 'Il tuo account è sospeso.' }
  const scheda = leggiScheda(form)
  if (!scheda.ok) return { errore: scheda.errore }
  const fiscali = leggiDatiFiscali(form)
  if (!fiscali.ok) return { errore: fiscali.errore }
  const s = scheda.dati
  const f = fiscali.dati

  const { error } = await supabase.rpc('diventa_professionista', {
    p_bio: s.bio,
    p_competenze: s.competenze,
    p_zone: s.zone,
    p_tariffa: s.tariffa,
    p_su_preventivo: s.suPreventivo,
    p_tipo: s.tipo,
    p_partita_iva: s.partitaIva ?? '',
    p_abilitazione: s.abilitazione,
    p_assicurazione: s.assicurazione,
    p_codice_fiscale: f.codiceFiscale,
    p_data_nascita: f.dataNascita,
    p_residenza: f.residenza,
    p_versione_termini: VERSIONE_DOCUMENTI,
  })
  if (error) return { errore: error.code === '23505' ? 'Hai già una scheda professionista.' : messaggioDb(error) }
  await registra(supabase, 'professionista_creato')
  revalidatePath('/', 'layout')
  redirect('/lavoro?nuova=1')
}

export async function modificaScheda(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const scheda = leggiScheda(form)
  if (!scheda.ok) return { errore: scheda.errore }
  const s = scheda.dati
  const { error } = await supabase
    .from('professionisti')
    .update({
      bio: s.bio,
      competenze: s.competenze,
      zone: s.zone,
      tariffa_oraria: s.tariffa,
      su_preventivo: s.suPreventivo,
      tipo: s.tipo,
      partita_iva: s.partitaIva,
      abilitazione_impianti: s.abilitazione,
      assicurazione_rc: s.assicurazione,
    })
    .eq('id', id)
  if (error) return { errore: messaggioDb(error) }
  revalidatePath('/lavoro')
  revalidatePath(`/professionisti/${id}`)
  return { ok: 'Scheda aggiornata.' }
}

export async function cambiaDisponibilita(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  controlla(await supabase.from('professionisti').update({ disponibile: form.get('disponibile') === 'si' }).eq('id', id), 'disponibilità')
  revalidatePath('/lavoro')
  revalidatePath('/')
}

export async function chiediVerifica(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const preferenza = form.get('preferenza') === 'di persona' ? 'di persona' : 'videochiamata'
  const disponibilita = String(form.get('disponibilita') ?? '').trim().slice(0, 200)
  if (disponibilita.length < 3) return { errore: 'Scrivi quando sei disponibile (es. “sera dopo le 18”).' }
  const { error } = await supabase.from('verifiche').insert({ professionista: id, preferenza, disponibilita })
  if (error) return { errore: error.code === '23505' ? 'Hai già una richiesta in attesa.' : messaggioDb(error) }
  revalidatePath('/lavoro/verifica')
  return { ok: 'Richiesta inviata: ti contattiamo in chat o per SMS per fissare la verifica.' }
}

export async function aggiornaResidenza(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const residenza = String(form.get('residenza') ?? '').trim().replace(/\s+/g, ' ')
  if (residenza.length < 6 || residenza.length > 200) return { errore: 'Scrivi l’indirizzo di residenza completo.' }
  const { error } = await supabase.from('dati_fiscali').update({ residenza }).eq('id', id)
  if (error) return { errore: messaggioDb(error) }
  return { ok: 'Residenza aggiornata.' }
}
