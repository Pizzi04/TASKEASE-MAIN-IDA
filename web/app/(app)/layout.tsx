import Link from 'next/link'
import { Tabs } from '@/components/Tabs'
import { richiediProfilo } from '@/lib/supabase/server'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { profilo } = await richiediProfilo()

  return (
    <>
      {profilo.sospeso && (
        <p className="avviso" role="alert">
          Il tuo account è sospeso: puoi vedere i tuoi dati ma non prenotare, pubblicare o scrivere.{' '}
          <Link href="/assistenza">Contesta la decisione</Link>
        </p>
      )}
      {profilo.in_pausa && !profilo.sospeso && (
        <p className="avviso">
          Il tuo profilo è in pausa: non compari nelle ricerche. <Link href="/profilo">Riattivalo</Link>
        </p>
      )}
      <div className="contenuto">{children}</div>
      <Tabs lavoro={profilo.ruolo === 'worker'} />
    </>
  )
}
