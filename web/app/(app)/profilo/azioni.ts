'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { StatoAzione } from '@/components/Modulo'
import { controlla, messaggioDb } from '@/lib/errori'
import { estensione, fotoValida } from '@/lib/foto'
import { richiediProfilo, supabaseAmministrazione } from '@/lib/supabase/server'
import { MOTIVI_USCITA, leggiModificaProfilo } from '@/lib/validazione'

export async function modificaProfilo(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id, profilo } = await richiediProfilo()
  const letto = leggiModificaProfilo({ nome: form.get('nome'), zona: form.get('zona') })
  if (!letto.ok) return { errore: letto.errore }

  const file = form.get('foto')
  const foto = file instanceof File && file.size > 0 ? file : null
  const erroreFoto = await fotoValida(foto)
  if (erroreFoto) return { errore: erroreFoto }

  const togli = form.get('togli_foto') === 'si'
  let percorso = togli ? null : profilo.foto
  let caricata: string | null = null
  // Se la foto va tolta non si carica niente: un file orfano occuperebbe uno dei 20 posti
  if (foto && !togli) {
    caricata = percorso = `${id}/profilo-${Date.now()}.${estensione(foto.type)}`
    const { error } = await supabase.storage.from('foto').upload(percorso, foto, { contentType: foto.type })
    if (error) return { errore: 'Non riesco a caricare la foto. Riprova.' }
  }

  const { error } = await supabase.from('profili').update({ ...letto.dati, foto: percorso }).eq('id', id)
  if (error) {
    if (caricata) await supabase.storage.from('foto').remove([caricata])
    return { errore: messaggioDb(error) }
  }
  if (profilo.foto && profilo.foto !== percorso) await supabase.storage.from('foto').remove([profilo.foto])
  revalidatePath('/', 'layout')
  return { ok: 'Profilo aggiornato.' }
}

export async function cambiaPausa(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  controlla(await supabase.from('profili').update({ in_pausa: form.get('pausa') === 'si' }).eq('id', id), 'pausa')
  revalidatePath('/', 'layout')
}

export async function sblocca(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  controlla(await supabase.from('blocchi').delete().eq('utente', id).eq('bloccato', String(form.get('utente'))), 'sblocco')
  revalidatePath('/profilo/bloccati')
}

export async function eliminaAccount(_p: StatoAzione, form: FormData): Promise<StatoAzione> {
  const { supabase, id } = await richiediProfilo()
  if (form.get('conferma') !== 'ELIMINA') return { errore: 'Per confermare scrivi ELIMINA in maiuscolo.' }
  const motivo = String(form.get('motivo') ?? '')
  const admin = supabaseAmministrazione()
  if (!admin) return { errore: 'L’eliminazione non è ancora attiva su questo server. Scrivi all’assistenza: la facciamo noi entro 30 giorni.' }

  const { error } = await supabase.rpc('prepara_eliminazione', {
    p_motivo: (MOTIVI_USCITA as readonly string[]).includes(motivo) ? motivo : undefined,
  })
  if (error) return { errore: messaggioDb(error) }

  // Foto: si cancellano prima dell'account
  const { data: file } = await admin.storage.from('foto').list(id, { limit: 1000 })
  if (file?.length) await admin.storage.from('foto').remove(file.map((f) => `${id}/${f.name}`))

  const { error: errElimina } = await admin.auth.admin.deleteUser(id)
  if (errElimina) return { errore: 'Non sono riuscito a eliminare l’account. Riprova o scrivi all’assistenza.' }
  await supabase.auth.signOut()
  redirect('/accedi?eliminato=1')
}
