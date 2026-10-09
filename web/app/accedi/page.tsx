import Link from 'next/link'
import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/supabase/server'
import ModuloAccesso from './modulo-accesso'

export const metadata = { title: 'Accedi · TaskEase' }

export default async function Accedi({ searchParams }: { searchParams: Promise<{ eliminato?: string }> }) {
  const { eliminato } = await searchParams
  const { id } = await utenteCorrente()
  if (id) redirect('/')

  return (
    <>
      <p className="marchio">TaskEase</p>
      {eliminato && <p className="conferma">Account eliminato. Grazie per essere passato da TaskEase.</p>}
      <h1>Entra con il tuo numero</h1>
      <p>Ti mandiamo un codice via SMS. Niente password da ricordare.</p>
      <ModuloAccesso />
      <p className="nota">
        Chi lavora nella zona di Forlì-Cesena, giudicato solo da chi l’ha davvero chiamato. Entrando accetti i{' '}
        <Link href="/legale/termini">Termini</Link> e confermi di aver letto l’<Link href="/legale/privacy">informativa privacy</Link>.
      </p>
    </>
  )
}
