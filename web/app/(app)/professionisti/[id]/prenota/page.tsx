import { notFound, redirect } from 'next/navigation'
import { Testata } from '@/components/Testata'
import { prossimiGiorni } from '@/lib/date'
import { registra } from '@/lib/eventi'
import { richiediProfilo } from '@/lib/supabase/server'
import { ORARI, orarioPrenotabile } from '@/lib/validazione'
import ModuloPrenota from './modulo-prenota'

export const metadata = { title: 'Prenota · TaskEase' }

export default async function Prenota({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ post?: string }>
}) {
  const { id: pro } = await params
  const { post } = await searchParams
  const { supabase, id, profilo } = await richiediProfilo()
  if (pro === id) redirect(`/professionisti/${pro}`)

  const [{ data: p }, { data: occupati }, { data: richiesta }] = await Promise.all([
    supabase
      .from('professionisti')
      .select('competenze, tariffa_oraria, su_preventivo, disponibile, profili!professionisti_id_fkey!inner(nome, in_pausa)')
      .eq('id', pro)
      .maybeSingle(),
    supabase.rpc('orari_occupati', { p_professionista: pro }),
    post ? supabase.from('bacheca').select('id, titolo, dettagli, competenza, zona').eq('id', Number(post)).eq('autore', id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  if (!p) notFound()
  if (!p.disponibile || p.profili.in_pausa) redirect(`/professionisti/${pro}`)
  await registra(supabase, 'prenotazione_avviata')

  const presi = new Set((occupati ?? []).map((o) => `${o.giorno} ${o.ora.slice(0, 5)}`))
  const giorni = prossimiGiorni(14).map((g) => ({
    ...g,
    orari: ORARI.map((o) => ({ ora: o, libero: orarioPrenotabile(g.iso, o) && !presi.has(`${g.iso} ${o}`) })),
  }))
  const nome = p.profili.nome.split(' ')[0]

  return (
    <>
      <Testata titolo={`Prenota ${nome}`} indietro={`/professionisti/${pro}`} />
      <ModuloPrenota
        professionista={pro}
        nome={nome}
        competenze={p.competenze}
        tariffa={p.tariffa_oraria}
        suPreventivo={p.su_preventivo}
        giorni={giorni}
        zona={richiesta?.zona ?? profilo.zona}
        post={richiesta?.id ?? null}
        descrizione={richiesta ? [richiesta.titolo, richiesta.dettagli].filter(Boolean).join('. ') : ''}
        competenzaIniziale={richiesta?.competenza && p.competenze.includes(richiesta.competenza) ? richiesta.competenza : p.competenze[0]}
      />
    </>
  )
}
