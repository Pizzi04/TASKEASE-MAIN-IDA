import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { QUARTIERI } from '@/lib/zone'

export const metadata = { title: 'Passaporto di quartiere · TaskEase' }

// Solo riconoscimento: nessun badge cambia l'ordine dei risultati o l'IDA di qualcuno.
export default async function Passaporto() {
  const { supabase, id } = await richiediProfilo()
  const { data } = await supabase.from('prenotazioni').select('zona, competenza').eq('cliente', id).eq('stato', 'completata')
  const lavori = data ?? []
  const timbri = new Map<string, number>()
  for (const b of lavori) timbri.set(b.zona, (timbri.get(b.zona) ?? 0) + 1)
  const quartieri = Object.keys(QUARTIERI)
  const zoneToccate = quartieri.filter((q) => timbri.has(q)).length
  const categorie = new Set(lavori.map((b) => b.competenza)).size

  const badge = [
    { n: 'Prima volta', ok: lavori.length >= 1, p: `${Math.min(lavori.length, 1)}/1 lavoro` },
    { n: 'Giro di Forlì', ok: zoneToccate >= 3, p: `${zoneToccate}/3 zone` },
    { n: 'Forlivese DOC', ok: zoneToccate >= quartieri.length, p: `${zoneToccate}/${quartieri.length} zone` },
    { n: 'Tuttofare', ok: categorie >= 6, p: `${categorie}/6 categorie` },
    { n: 'Di lunga data', ok: lavori.length >= 20, p: `${lavori.length}/20 lavori` },
  ]

  return (
    <>
      <Testata titolo="Passaporto di quartiere" indietro="/profilo" sotto="Un timbro per ogni lavoro completato" />
      <div className="mappa" role="img" aria-label={`Timbri in ${zoneToccate} quartieri su ${quartieri.length}`}>
        {quartieri.map((q) => {
          const n = timbri.get(q) ?? 0
          return (
            <span key={q} className={n ? 'timbro pieno' : 'timbro'} style={{ left: `${QUARTIERI[q].x}%`, top: `${QUARTIERI[q].y}%` }}>
              <b>{n || ''}</b>
              <small>{q}</small>
            </span>
          )
        })}
      </div>
      <section aria-label="Badge">
        <h2>Badge</h2>
        {badge.map((b) => (
          <div key={b.n} className={b.ok ? 'scheda interruttore ottenuto' : 'scheda interruttore'}>
            <b>{b.n}</b>
            <span className="nota">{b.ok ? 'Ottenuto ✓' : b.p}</span>
          </div>
        ))}
      </section>
      <p className="nota">Solo un riconoscimento: non dà corsie preferenziali e non cambia l’IDA di nessuno.</p>
    </>
  )
}
