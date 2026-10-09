'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { StatoAzione } from '@/components/Modulo'
import { controlla, messaggioDb } from '@/lib/errori'
import { registra } from '@/lib/eventi'
import { richiediProfilo } from '@/lib/supabase/server'
import { leggiPrenotazione } from '@/lib/validazione'

export async function preferito(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  const pro = String(form.get('professionista'))
  if (form.get('azione') === 'togli') {
    controlla(await supabase.from('preferiti').delete().eq('utente', id).eq('professionista', pro), 'preferiti')
  } else {
    controlla(await supabase.from('preferiti').insert({ utente: id, professionista: pro }), 'preferiti')
  }
  revalidatePath(`/professionisti/${pro}`)
}

export async function blocca(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  const chi = String(form.get('utente'))
  if (chi !== id) controlla(await supabase.from('blocchi').insert({ utente: id, bloccato: chi }), 'blocco')
  redirect('/profilo/bloccati')
}

export async function rispondiGiudizio(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase } = await richiediProfilo()
  const testo = String(form.get('risposta') ?? '').trim()
  if (testo.length < 2) return { errore: 'Scrivi la tua risposta.' }
  if (testo.length > 500) return { errore: 'Massimo 500 caratteri.' }
  const { error } = await supabase.rpc('rispondi_giudizio', { p_prenotazione: Number(form.get('prenotazione')), p_testo: testo })
  if (error) return { errore: messaggioDb(error) }
  revalidatePath('/lavoro/giudizi')
  return { ok: 'Risposta pubblicata.' }
}

export async function prenota(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id, profilo } = await richiediProfilo()
  if (profilo.sospeso) return { errore: 'Il tuo account è sospeso.' }
  const pro = String(form.get('professionista'))
  const { data: scheda } = await supabase
    .from('professionisti')
    .select('competenze, tariffa_oraria, disponibile')
    .eq('id', pro)
    .maybeSingle()
  if (!scheda) return { errore: 'Questa persona non è più su TaskEase.' }
  if (!scheda.disponibile) return { errore: 'Questa persona ora non è disponibile.' }

  const letto = leggiPrenotazione(form, scheda.competenze)
  if (!letto.ok) return { errore: letto.errore }
  const d = letto.dati
  const post = Number(form.get('post')) || null

  const { data: nuova, error } = await supabase.rpc('prenota', {
    p_professionista: pro,
    p_competenza: d.competenza,
    p_descrizione: d.descrizione,
    p_indirizzo: d.indirizzo,
    p_zona: d.zona,
    p_giorno: d.giorno,
    p_ora: d.ora,
    p_ore: d.ore,
    p_tariffa: scheda.tariffa_oraria,
    p_post: post,
  })
  if (error) {
    if (error.code === '23505') return { errore: 'Quell’orario è stato appena preso: scegline un altro.' }
    if (error.code === '42501') return { errore: 'Non puoi prenotare questa persona.' }
    return { errore: messaggioDb(error) }
  }
  if (id) await registra(supabase, 'prenotazione_inviata')
  redirect(`/prenotazioni/${nuova}?inviata=1`)
}
