import { notFound } from 'next/navigation'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import Chat from './chat'

export const metadata = { title: 'Chat · TaskEase' }

export default async function PaginaChat({ params }: { params: Promise<{ id: string }> }) {
  const { id: idTesto } = await params
  const { supabase, id } = await richiediProfilo()
  const pid = Number(idTesto)
  const { data: b } = await supabase
    .from('prenotazioni')
    .select('id, stato, competenza, professionista, cliente_p:profili!prenotazioni_cliente_fkey(nome), professionisti!prenotazioni_professionista_fkey(profili!professionisti_id_fkey(nome))')
    .eq('id', pid)
    .maybeSingle()
  if (!b) notFound()
  const { data: messaggi } = await supabase
    .from('messaggi')
    .select('id, autore, testo, creato_il, letto_il')
    .eq('prenotazione', pid)
    .order('creato_il')
    .limit(500)
  await supabase.rpc('segna_letti', { p_prenotazione: pid })

  const altro = b.professionista === id ? b.cliente_p?.nome : b.professionisti?.profili?.nome
  const chiusa = b.stato === 'rifiutata' || b.stato === 'annullata'

  return (
    <>
      <Testata titolo={altro ?? 'Chat'} indietro={`/prenotazioni/${pid}`} sotto={b.competenza} />
      <p className="nota">Concorda qui lavoro, ore e prezzo: resta scritto. Non mandare soldi in anticipo.</p>
      <Chat prenotazione={pid} io={id} iniziali={messaggi ?? []} chiusa={chiusa} />
    </>
  )
}
