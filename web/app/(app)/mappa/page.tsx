import { COLONNE_PRO, daRiga } from '@/components/RigaProfessionista'
import { Testata } from '@/components/Testata'
import { CATEGORIE } from '@/lib/categorie'
import { idaVisibile } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { QUARTIERI } from '@/lib/zone'
import { MappaGrande, type PersonaMappa } from './mappa-grande'

export const metadata = { title: 'Mappa della zona · TaskEase' }

export default async function Mappa() {
  const { supabase, id, profilo } = await richiediProfilo()
  const [{ data }, { data: blocchi }] = await Promise.all([
    supabase.from('professionisti').select(COLONNE_PRO).eq('profili.in_pausa', false).limit(300),
    supabase.from('blocchi').select('bloccato').eq('utente', id),
  ])
  const bloccati = new Set((blocchi ?? []).map((b) => b.bloccato))
  // Ognuno compare nella prima delle sue zone che sta sulla mappa (le zone fuori città non hanno un punto)
  const persone: PersonaMappa[] = (data ?? [])
    .map(daRiga)
    .filter((p) => p.id !== id && !bloccati.has(p.id))
    .flatMap((p) => {
      const zona = p.zone.find((z) => z in QUARTIERI)
      return zona
        ? [{ id: p.id, nome: p.nome, competenze: p.competenze, zona, disponibile: p.disponibile, ida: idaVisibile(p.ida, p.giudizi), tariffa: p.tariffa_oraria, preventivo: p.su_preventivo }]
        : []
    })

  return (
    <>
      <Testata titolo="Mappa della zona" indietro="/" />
      <MappaGrande persone={persone} mia={profilo.zona} categorie={CATEGORIE.map((c) => c.n)} />
    </>
  )
}
