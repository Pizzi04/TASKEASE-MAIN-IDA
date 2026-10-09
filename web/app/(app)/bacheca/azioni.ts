'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { StatoAzione } from '@/components/Modulo'
import { controlla, messaggioDb } from '@/lib/errori'
import { registra } from '@/lib/eventi'
import { estensione, fotoValida } from '@/lib/foto'
import { richiediProfilo } from '@/lib/supabase/server'
import { haTelefonoOEmail, leggiPost, pulisci } from '@/lib/validazione'

export async function pubblica(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id, profilo } = await richiediProfilo()
  if (profilo.sospeso) return { errore: 'Il tuo account è sospeso.' }
  const letto = leggiPost(form)
  if (!letto.ok) return { errore: letto.errore }

  const file = form.get('foto')
  const foto = file instanceof File && file.size > 0 ? file : null
  const erroreFoto = await fotoValida(foto)
  if (erroreFoto) return { errore: erroreFoto }

  let percorso: string | null = null
  if (foto) {
    percorso = `${id}/bacheca-${crypto.randomUUID()}.${estensione(foto.type)}`
    const { error } = await supabase.storage.from('foto').upload(percorso, foto, { contentType: foto.type })
    if (error) return { errore: 'Non riesco a caricare la foto. Riprova o pubblica senza.' }
  }

  const { data, error } = await supabase
    .from('bacheca')
    .insert({ autore: id, ...letto.dati, foto: percorso })
    .select('id')
    .single()
  if (error) {
    if (percorso) await supabase.storage.from('foto').remove([percorso])
    return { errore: messaggioDb(error) }
  }
  await registra(supabase, 'post_pubblicato')
  revalidatePath('/bacheca')
  redirect(`/bacheca/${data.id}?pubblicata=1`)
}

export async function cambiaStatoPost(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  const post = Number(form.get('post'))
  const stato = form.get('stato') === 'aperta' ? 'aperta' : 'chiusa'
  controlla(await supabase.from('bacheca').update({ stato }).eq('id', post).eq('autore', id), 'richiesta')
  revalidatePath(`/bacheca/${post}`)
  revalidatePath('/bacheca')
}

export async function proponi(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  const post = Number(form.get('post'))
  const messaggio = pulisci(form.get('messaggio')).replace(/\s+/g, ' ')
  if (messaggio.length < 5 || messaggio.length > 300) return { errore: 'Scrivi una proposta da 5 a 300 caratteri.' }
  if (haTelefonoOEmail(messaggio)) return { errore: 'Non scrivere telefono o email: se ti sceglie, vi scrivete in chat.' }
  const { error } = await supabase.from('proposte').insert({ post, professionista: id, messaggio })
  if (error) return { errore: error.code === '23505' ? 'Hai già risposto a questa richiesta.' : messaggioDb(error) }
  await registra(supabase, 'proposta_inviata')
  revalidatePath(`/bacheca/${post}`)
  return { ok: 'Proposta inviata: se ti sceglie, ti arriva la prenotazione.' }
}

export async function ritira(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  const post = Number(form.get('post'))
  controlla(await supabase.from('proposte').delete().eq('post', post).eq('professionista', id), 'proposta')
  revalidatePath(`/bacheca/${post}`)
}
