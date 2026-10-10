import { Modulo } from '@/components/Modulo'
import SceltaFoto from '@/components/SceltaFoto'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { COMPETENZE, ZONE } from '@/lib/validazione'
import { pubblica } from '../azioni'

export const metadata = { title: 'Pubblica una richiesta · TaskEase' }

export default async function NuovaRichiesta({ searchParams }: { searchParams: Promise<{ titolo?: string; competenza?: string }> }) {
  const { profilo } = await richiediProfilo()
  // Precompilata quando arriva da una prenotazione rifiutata o annullata
  const sp = await searchParams
  const titolo = (sp.titolo ?? '').slice(0, 100)
  const competenza = (COMPETENZE as readonly string[]).includes(sp.competenza ?? '') ? sp.competenza! : ''
  return (
    <>
      <Testata titolo="Pubblica una richiesta" indietro="/bacheca" />
      <Modulo azione={pubblica} invio="Pubblica sulla bacheca" inCorso="Pubblico…">
        <label htmlFor="titolo">Cosa ti serve?</label>
        <input id="titolo" name="titolo" type="text" maxLength={100} placeholder="Es. Montare un armadio a tre ante" defaultValue={titolo} required />
        <label htmlFor="dettagli">Qualche dettaglio</label>
        <textarea id="dettagli" name="dettagli" rows={4} maxLength={600} placeholder="Misure, accesso, materiali, quando ti farebbe comodo…" />
        <p className="nota">La bacheca la vedono tutti: niente indirizzo preciso o telefono. Li dai in chat a chi scegli.</p>
        <label htmlFor="zona">Zona</label>
        <select id="zona" name="zona" defaultValue={profilo.zona}>
          {ZONE.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <label htmlFor="competenza">Categoria (facoltativa)</label>
        <select id="competenza" name="competenza" defaultValue={competenza}>
          <option value="">Non so</option>
          {COMPETENZE.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label htmlFor="foto">Una foto aiuta (facoltativa)</label>
        <SceltaFoto />
        <p className="nota">JPG, PNG o WebP fino a 3 MB. Resta visibile 14 giorni, poi la richiesta scade.</p>
      </Modulo>
    </>
  )
}
