import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/supabase/server'
import ModuloAccesso from './modulo-accesso'

export const metadata = { title: 'Accedi · TaskEase' }

export default async function Accedi() {
  const { id } = await utenteCorrente()
  if (id) redirect('/')

  return (
    <>
      <p className="marchio">TaskEase</p>
      <h1>Entra con il tuo numero</h1>
      <p>Ti mandiamo un codice via SMS. Niente password da ricordare.</p>
      <ModuloAccesso />
    </>
  )
}
