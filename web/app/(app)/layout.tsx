import Link from 'next/link'
import { Campanella } from '@/components/Campanella'
import { Tabs } from '@/components/Tabs'
import { richiediProfilo } from '@/lib/supabase/server'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { supabase, id, profilo } = await richiediProfilo()
  const { count } = await supabase
    .from('notifiche')
    .select('id', { count: 'exact', head: true })
    .eq('utente', id)
    .eq('letta', false)

  return (
    <>
      <div className="barra-alta">
        <Link href="/" className="marchio piccolo">
          TaskEase
        </Link>
        <Campanella utente={id} iniziali={count ?? 0} />
      </div>
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
