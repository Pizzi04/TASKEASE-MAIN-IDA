'use server'

import { revalidatePath } from 'next/cache'
import type { StatoAzione } from '@/components/Modulo'
import { messaggioDb } from '@/lib/errori'
import { richiediAdmin } from '@/lib/supabase/server'

export async function decidiSegnalazione(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase } = await richiediAdmin()
  const esito = form.get('esito') === 'accolta' ? 'accolta' : 'respinta'
  const azione = esito === 'respinta' ? 'nessuna' : String(form.get('azione') ?? 'nessuna')
  const motivazione = String(form.get('motivazione') ?? '').trim()
  if (motivazione.length < 10) return { errore: 'Scrivi una motivazione di almeno 10 caratteri: la leggono entrambe le persone.' }
  const { error } = await supabase.rpc('decidi_segnalazione', {
    p_id: Number(form.get('id')),
    p_esito: esito,
    p_azione: azione,
    p_motivazione: motivazione,
  })
  if (error) return { errore: messaggioDb(error) }
  revalidatePath('/admin/segnalazioni')
  return { ok: 'Decisione registrata e comunicata.' }
}

export async function decidiVerifica(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase } = await richiediAdmin()
  const esito = form.get('esito') === 'verificata' ? 'verificata' : 'respinta'
  const motivazione = String(form.get('motivazione') ?? '').trim()
  if (esito === 'respinta' && motivazione.length < 5) return { errore: 'Spiega perché la verifica non è riuscita.' }
  if (form.get('documento_visto') !== 'si' && esito === 'verificata') return { errore: 'Conferma di aver visto il documento.' }
  const { error } = await supabase.rpc('decidi_verifica', { p_id: Number(form.get('id')), p_esito: esito, p_motivazione: motivazione || undefined })
  if (error) return { errore: messaggioDb(error) }
  revalidatePath('/admin/verifiche')
  return { ok: esito === 'verificata' ? 'Verificata: il badge è attivo.' : 'Registrato.' }
}

export async function riattiva(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase } = await richiediAdmin()
  const motivazione = String(form.get('motivazione') ?? '').trim()
  const { error } = await supabase.rpc('riattiva_account', { p_utente: String(form.get('utente')), p_motivazione: motivazione })
  if (error) return { errore: messaggioDb(error) }
  revalidatePath('/admin/sospesi')
  return { ok: 'Account riattivato.' }
}
