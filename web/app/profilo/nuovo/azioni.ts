'use server'

import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/supabase/server'
import { DOCUMENTI, leggiProfilo } from '@/lib/validazione'

export type StatoProfilo = { errore: string } | null

export async function creaProfilo(_prima: StatoProfilo, form: FormData): Promise<StatoProfilo> {
  const { supabase, id } = await utenteCorrente()
  if (!id) redirect('/accedi')

  const letto = leggiProfilo({
    nome: form.get('nome'),
    zona: form.get('zona'),
    consenso: form.get('consenso'),
  })
  if (!letto.ok) return { errore: letto.errore }

  // Prima i consensi: se il profilo poi fallisce resta solo la traccia di un'accettazione, mai un profilo senza consenso.
  const consensi = await supabase
    .from('consensi')
    .insert(DOCUMENTI.map((d) => ({ utente: id, documento: d.documento, versione: d.versione })))
  if (consensi.error) return { errore: 'Non riesco a salvare. Riprova tra poco.' }

  const profilo = await supabase.from('profili').insert({ id, nome: letto.dati.nome, zona: letto.dati.zona })
  if (profilo.error && profilo.error.code !== '23505') {
    return { errore: 'Non riesco a salvare il profilo. Riprova tra poco.' }
  }

  redirect('/')
}
