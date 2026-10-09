import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/supabase/server'
import ModuloProfilo from './modulo-profilo'

export const metadata = { title: 'Il tuo profilo · TaskEase' }

export default async function NuovoProfilo() {
  const { supabase, id } = await utenteCorrente()
  if (!id) redirect('/accedi')

  const { data } = await supabase.from('profili').select('id').eq('id', id).maybeSingle()
  if (data) redirect('/')

  return (
    <>
      <p className="marchio">TaskEase</p>
      <h1>Due cose su di te</h1>
      <p>Servono per mostrarti chi lavora vicino a casa tua.</p>
      <ModuloProfilo />
    </>
  )
}
