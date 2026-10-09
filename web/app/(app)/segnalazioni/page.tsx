import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { richiediProfilo } from '@/lib/supabase/server'

export const metadata = { title: 'Le mie segnalazioni · TaskEase' }

const ESITI: Record<string, string> = { aperta: 'In esame', accolta: 'Accolta', respinta: 'Respinta' }

export default async function Segnalazioni({ searchParams }: { searchParams: Promise<{ inviata?: string }> }) {
  const { supabase, id } = await richiediProfilo()
  const { inviata } = await searchParams
  const { data } = await supabase
    .from('segnalazioni')
    .select('id, tipo, oggetto_tipo, motivo, stato, motivazione, creato_il, deciso_il')
    .eq('autore', id)
    .order('creato_il', { ascending: false })

  return (
    <>
      <Testata titolo="Le mie segnalazioni" indietro="/profilo" />
      {inviata && <p className="conferma">Segnalazione inviata. Rispondiamo entro 48 ore.</p>}
      {(data ?? []).length === 0 && <p className="vuoto">Non hai fatto segnalazioni.</p>}
      {(data ?? []).map((s) => (
        <article key={s.id} className="scheda">
          <b>{s.motivo}</b>
          <p className="nota">
            {s.oggetto_tipo} · inviata {quandoFa(s.creato_il)} · <span className={s.stato === 'aperta' ? 'stato' : 'stato ok'}>{ESITI[s.stato]}</span>
          </p>
          {s.motivazione && <p>Decisione: {s.motivazione}</p>}
        </article>
      ))}
      <p className="nota">Non sei d’accordo con una decisione? Puoi contestarla gratis dall’assistenza entro 6 mesi: la riesamina una persona.</p>
    </>
  )
}
