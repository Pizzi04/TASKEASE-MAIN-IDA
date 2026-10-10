'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { StatoAzione } from '@/components/Modulo'
import { messaggioDb } from '@/lib/errori'
import { leggiVoti } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { orarioPrenotabile, pulisci } from '@/lib/validazione'

const AZIONI = ['conferma', 'rifiuta', 'annulla', 'completa', 'accetta_orario', 'non_presentato'] as const

export async function cambiaStato(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase } = await richiediProfilo()
  const id = Number(form.get('id'))
  const azione = String(form.get('azione'))
  if (!(AZIONI as readonly string[]).includes(azione)) return { errore: 'Azione non valida.' }
  const motivo = pulisci(form.get('motivo')).slice(0, 300) || undefined
  const { error } = await supabase.rpc('cambia_stato_prenotazione', { p_id: id, p_azione: azione, p_motivo: motivo })
  if (error) {
    if (error.code === 'P0001') {
      // La prenotazione può essere cambiata nel frattempo dall'altra persona: diciamo cosa è successo davvero
      const { data: ora } = await supabase.from('prenotazioni').select('stato').eq('id', id).maybeSingle()
      revalidatePath(`/prenotazioni/${id}`)
      if (ora && ora.stato !== 'richiesta' && ora.stato !== 'confermata') {
        const stati: Record<string, string> = { annullata: 'è già stata annullata', rifiutata: 'è stata rifiutata', completata: 'è già segnata come fatta' }
        return { errore: `Nel frattempo la prenotazione ${stati[ora.stato] ?? 'è cambiata'}: ricarica la pagina.` }
      }
      if (azione === 'completa') return { errore: 'Puoi segnare il lavoro come fatto solo quando è finito (orario più le ore previste).' }
      if (azione === 'annulla') return { errore: 'Dopo l’orario non si può più annullare: segna com’è andata.' }
    }
    return { errore: messaggioDb(error) }
  }
  revalidatePath(`/prenotazioni/${id}`)
  revalidatePath('/prenotazioni')
  if (azione === 'non_presentato') return { ok: 'Segnalato: leggiamo la segnalazione e ti rispondiamo entro 48 ore.' }
  return { ok: azione === 'conferma' || azione === 'accetta_orario' ? 'Confermata.' : 'Fatto.' }
}

export async function proponiOrario(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase } = await richiediProfilo()
  const id = Number(form.get('id'))
  const giorno = String(form.get('giorno') ?? '')
  const ora = String(form.get('ora') ?? '')
  if (!orarioPrenotabile(giorno, ora)) return { errore: 'Scegli un orario: almeno un’ora da adesso, entro 30 giorni.' }
  const { error } = await supabase.rpc('proponi_orario', { p_id: id, p_giorno: giorno, p_ora: ora })
  if (error) return { errore: messaggioDb(error) }
  revalidatePath(`/prenotazioni/${id}`)
  return { ok: 'Proposta inviata: il cliente deve accettarla.' }
}

export async function lasciaGiudizio(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const prenotazione = Number(form.get('prenotazione'))
  const voti = leggiVoti(form)
  if (!voti) return { errore: 'Rispondi a tutte e cinque le domande.' }
  const commento = pulisci(form.get('commento'))
  if (commento.length > 500) return { errore: 'Il commento è troppo lungo (massimo 500 caratteri).' }

  const { data: b } = await supabase.from('prenotazioni').select('professionista, stato').eq('id', prenotazione).eq('cliente', id).maybeSingle()
  if (!b || b.stato !== 'completata') return { errore: 'Puoi giudicare solo un lavoro completato.' }
  const { error } = await supabase
    .from('giudizi')
    .insert({ prenotazione, cliente: id, professionista: b.professionista, ...voti, commento: commento || null })
  if (error) return { errore: error.code === '23505' ? 'Hai già lasciato il giudizio per questo lavoro.' : messaggioDb(error) }
  revalidatePath(`/professionisti/${b.professionista}`)
  redirect(`/prenotazioni/${prenotazione}?giudicata=1`)
}

export async function inviaMessaggio(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const prenotazione = Number(form.get('prenotazione'))
  const testo = pulisci(form.get('testo'))
  if (!testo) return null
  if (testo.length > 1000) return { errore: 'Messaggio troppo lungo (massimo 1000 caratteri).' }
  const { error } = await supabase.from('messaggi').insert({ prenotazione, autore: id, testo })
  if (error) return { errore: error.code === '42501' ? 'In questa prenotazione non si può più scrivere.' : messaggioDb(error) }
  return { ok: '' }
}
