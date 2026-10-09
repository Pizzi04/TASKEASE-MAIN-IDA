import Link from 'next/link'
import { COLONNE_PRO, RigaProfessionista, daRiga } from '@/components/RigaProfessionista'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'

export const metadata = { title: 'Preferiti · TaskEase' }

export default async function Preferiti() {
  const { supabase, id } = await richiediProfilo()
  const { data } = await supabase
    .from('preferiti')
    .select(`creato_il, professionisti!preferiti_professionista_fkey(${COLONNE_PRO})`)
    .eq('utente', id)
    .order('creato_il', { ascending: false })
  const lista = (data ?? []).flatMap((r) => (r.professionisti ? [daRiga(r.professionisti)] : []))
  return (
    <>
      <Testata titolo="Preferiti" indietro="/profilo" />
      {lista.length === 0 ? (
        <p className="vuoto">
          Nessun preferito. Dalla scheda di chi ti è piaciuto tocca “Aggiungi ai preferiti”. <Link href="/cerca">Cerca</Link>
        </p>
      ) : (
        lista.map((p) => <RigaProfessionista key={p.id} p={p} />)
      )}
    </>
  )
}
