'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { controlla } from '@/lib/errori'
import { richiediProfilo } from '@/lib/supabase/server'

// Selettore "Cerco | Lavoro": cambia solo la vista. Per lavorare serve la scheda professionista.
export async function cambiaRuolo(form: FormData) {
  const { supabase, id } = await richiediProfilo()
  const ruolo = form.get('ruolo') === 'worker' ? 'worker' : 'client'
  if (ruolo === 'worker') {
    const { data } = await supabase.from('professionisti').select('id').eq('id', id).maybeSingle()
    if (!data) redirect('/lavoro/diventa')
  }
  controlla(await supabase.from('profili').update({ ruolo }).eq('id', id), 'ruolo')
  revalidatePath('/', 'layout')
  redirect('/')
}
