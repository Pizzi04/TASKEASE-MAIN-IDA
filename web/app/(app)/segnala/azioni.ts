'use server'

import { redirect } from 'next/navigation'
import type { StatoAzione } from '@/components/Modulo'
import { messaggioDb } from '@/lib/errori'
import { richiediProfilo, type Db } from '@/lib/supabase/server'
import { leggiSegnalazione } from '@/lib/validazione'

const OGGETTI = ['profilo', 'giudizio', 'post', 'messaggio', 'prenotazione'] as const
type Oggetto = (typeof OGGETTI)[number]

// Chi è la persona segnalata lo ricaviamo dal database, non dal link
async function autoreDi(supabase: Db, oggetto: Oggetto, id: string, io: string): Promise<string | null> {
  if (oggetto === 'profilo') return /^[0-9a-f-]{36}$/.test(id) ? id : null
  const n = Number(id)
  if (!Number.isInteger(n)) return null
  if (oggetto === 'giudizio') return (await supabase.from('giudizi').select('cliente').eq('prenotazione', n).maybeSingle()).data?.cliente ?? null
  if (oggetto === 'post') return (await supabase.from('bacheca').select('autore').eq('id', n).maybeSingle()).data?.autore ?? null
  if (oggetto === 'messaggio') return (await supabase.from('messaggi').select('autore').eq('id', n).maybeSingle()).data?.autore ?? null
  const b = (await supabase.from('prenotazioni').select('cliente, professionista').eq('id', n).maybeSingle()).data
  if (!b) return null
  return b.cliente === io ? b.professionista : b.cliente
}

export async function inviaSegnalazione(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const tipo = form.get('tipo') === 'problema_lavoro' ? 'problema_lavoro' : 'contenuto'
  const oggetto = String(form.get('oggetto')) as Oggetto
  const oggettoId = String(form.get('id') ?? '').slice(0, 40)
  if (!OGGETTI.includes(oggetto) || !oggettoId) return { errore: 'Non so cosa stai segnalando: torna indietro e riprova.' }
  const letto = leggiSegnalazione(form)
  if (!letto.ok) return { errore: letto.errore }

  const segnalato = await autoreDi(supabase, oggetto, oggettoId, id)
  if (segnalato === id) return { errore: 'Non puoi segnalare un tuo contenuto.' }
  const { error } = await supabase.from('segnalazioni').insert({
    autore: id,
    tipo,
    oggetto_tipo: oggetto,
    oggetto_id: oggettoId,
    segnalato,
    motivo: letto.dati.motivo,
    testo: letto.dati.testo,
  })
  if (error) return { errore: messaggioDb(error) }
  redirect('/segnalazioni?inviata=1')
}
