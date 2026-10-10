import Link from 'next/link'
import { NotifichePush } from '@/components/AppInstallabile'
import { notFound } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { etichettaGiorno, finita, oraBreve, passata, prossimiGiorni } from '@/lib/date'
import { VOCI } from '@/lib/ida'
import { STATI } from '@/lib/stati'
import { richiediProfilo } from '@/lib/supabase/server'
import { ORARI } from '@/lib/validazione'
import { cambiaStato, proponiOrario } from '../azioni'

export const metadata = { title: 'Prenotazione · TaskEase' }

export default async function Prenotazione({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ inviata?: string; giudicata?: string }>
}) {
  const { id: idTesto } = await params
  const sp = await searchParams
  const { supabase, id } = await richiediProfilo()
  const pid = Number(idTesto)
  if (!Number.isInteger(pid)) notFound()

  const { data: b } = await supabase
    .from('prenotazioni')
    .select(
      '*, cliente_p:profili!prenotazioni_cliente_fkey(nome), professionisti!prenotazioni_professionista_fkey(su_preventivo, profili!professionisti_id_fkey(nome)), giudizi!giudizi_prenotazione_fkey(punteggio, puntualita, qualita, parola, pulizia, comunicazione, commento, risposta)',
    )
    .eq('id', pid)
    .maybeSingle()
  if (!b) notFound()
  const { data: ind } = await supabase.from('indirizzi').select('indirizzo').eq('prenotazione', pid).maybeSingle()

  const sonoPro = b.professionista === id
  const altro = sonoPro ? b.cliente_p?.nome : b.professionisti?.profili?.nome
  const primo = (altro ?? '').split(' ')[0]
  const g = b.giudizi
  const fatta = passata(b.giorno, b.ora)
  const attiva = b.stato === 'richiesta' || b.stato === 'confermata'
  const azione = (valore: string, testo: string, tipo: 'bottone' | 'pericolo' | 'secondario' = 'bottone', conMotivo = false) => (
    <Modulo azione={cambiaStato} invio={testo} tipo={tipo} className="modulo-azione">
      <input type="hidden" name="id" value={pid} />
      <input type="hidden" name="azione" value={valore} />
      {conMotivo && (
        <>
          <label htmlFor={`motivo-${valore}`}>Motivo (facoltativo, lo legge {primo})</label>
          <input id={`motivo-${valore}`} name="motivo" type="text" maxLength={300} />
        </>
      )}
    </Modulo>
  )

  return (
    <>
      <Testata titolo={b.competenza} indietro="/prenotazioni" sotto={sonoPro ? `Cliente: ${altro}` : `Con ${altro}`} />
      {sp.inviata && (
        <>
          <p className="conferma">Richiesta inviata. {primo} la conferma o propone un altro orario: ti avvisiamo qui.</p>
          <div className="scheda">
            <p className="nota">Vuoi saperlo subito anche ad app chiusa?</p>
            <NotifichePush />
          </div>
        </>
      )}
      {sp.giudicata && <p className="conferma">Grazie: il tuo giudizio è nell’IDA di {primo}.</p>}

      <dl className="scheda dati">
        <div className="riga">
          <dt>Stato</dt>
          <dd>{b.stato === 'richiesta' && b.controproposta ? 'Nuovo orario proposto' : STATI[b.stato]}</dd>
        </div>
        <div className="riga">
          <dt>Quando</dt>
          <dd>
            {etichettaGiorno(b.giorno)} alle {oraBreve(b.ora)}
          </dd>
        </div>
        <div className="riga">
          <dt>Durata</dt>
          <dd>{b.ore ? `${b.ore} ${b.ore === 1 ? 'ora' : 'ore'} (stima)` : 'Da stimare'}</dd>
        </div>
        <div className="riga">
          <dt>Tariffa</dt>
          <dd>{b.professionisti?.su_preventivo ? 'Su preventivo · si paga tra voi' : `${b.tariffa_oraria} € l’ora · si paga tra voi`}</dd>
        </div>
        <div className="riga">
          <dt>Dove</dt>
          <dd>{ind?.indirizzo ?? `${b.zona} · indirizzo visibile dopo la conferma`}</dd>
        </div>
        {b.motivo && (
          <div className="riga">
            <dt>Nota</dt>
            <dd>{b.motivo}</dd>
          </div>
        )}
      </dl>
      <p className="scheda descrizione">{b.descrizione}</p>

      {/* Azioni di chi lavora */}
      {sonoPro && b.stato === 'richiesta' && !b.controproposta && !fatta && (
        <section className="azioni" aria-label="Rispondi">
          {azione('conferma', 'Conferma')}
          <details>
            <summary>Proponi un altro orario</summary>
            <Modulo azione={proponiOrario} invio="Proponi" className="modulo-azione">
              <input type="hidden" name="id" value={pid} />
              <label htmlFor="giorno">Giorno</label>
              <select id="giorno" name="giorno">
                {prossimiGiorni(14).map((d) => (
                  <option key={d.iso} value={d.iso}>
                    {d.etichetta}
                  </option>
                ))}
              </select>
              <label htmlFor="ora">Ora</label>
              <select id="ora" name="ora">
                {ORARI.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Modulo>
          </details>
          <details>
            <summary>Non posso</summary>
            {azione('rifiuta', 'Rifiuta la richiesta', 'pericolo', true)}
          </details>
          <p className="nota">Rifiutare non abbassa il tuo IDA.</p>
        </section>
      )}
      {sonoPro && b.stato === 'richiesta' && b.controproposta && <p className="avviso">Hai proposto un nuovo orario: aspetta che {primo} lo accetti.</p>}
      {b.stato === 'richiesta' && fatta && (
        <p className="avviso">L’orario è passato senza conferma: la richiesta verrà chiusa in automatico.</p>
      )}
      {b.stato === 'confermata' && fatta && (
        <section className="azioni" aria-label="Com’è andata">
          {finita(b.giorno, b.ora, b.ore) ? (
            azione('completa', 'Lavoro fatto')
          ) : (
            <p className="nota">Quando il lavoro è finito potrai segnarlo come fatto.</p>
          )}
          {!sonoPro && (
            <details>
              <summary>Non si è presentato nessuno</summary>
              {azione('non_presentato', 'Segnala che non è venuto', 'pericolo', true)}
            </details>
          )}
          <p className="nota">Se nessuno lo segna, il lavoro si considera fatto 48 ore dopo l’orario e si può lasciare il giudizio.</p>
        </section>
      )}

      {/* Azioni del cliente */}
      {!sonoPro && b.stato === 'richiesta' && b.controproposta && !fatta && (
        <section className="azioni" aria-label="Nuovo orario">
          <p className="avviso">
            {primo} propone {etichettaGiorno(b.giorno)} alle {oraBreve(b.ora)}.
          </p>
          {azione('accetta_orario', 'Va bene, confermo')}
        </section>
      )}
      {!sonoPro && b.stato === 'completata' && !g && (
        <Link href={`/prenotazioni/${pid}/giudizio`} className="bottone">
          Lascia il giudizio IDA
        </Link>
      )}

      {attiva && !(b.stato === 'confermata' && fatta) && (
        <details>
          <summary>Annulla la prenotazione</summary>
          {azione('annulla', 'Annulla', 'pericolo', true)}
        </details>
      )}

      {g && (
        <section className="scheda" aria-label="Giudizio">
          <h2>Giudizio: {g.punteggio}/100</h2>
          <dl className="voci">
            {VOCI.map((v) => (
              <div key={v.k} className="riga">
                <dt>{v.l}</dt>
                <dd>{g[v.k]} / 5</dd>
              </div>
            ))}
          </dl>
          {g.commento && <p>“{g.commento}”</p>}
          {g.risposta && <p className="risposta">Risposta: {g.risposta}</p>}
          {sonoPro && !g.risposta && (
            <Link href="/lavoro/giudizi" className="secondario">
              Rispondi al giudizio
            </Link>
          )}
        </section>
      )}

      {!sonoPro && (b.stato === 'rifiutata' || b.stato === 'annullata') && (
        <section className="azioni" aria-label="E adesso">
          <p className="nota">Ti serve ancora? Trova un’altra persona o lascia che rispondano loro.</p>
          <div className="azioni-due">
            <Link href={`/cerca?competenza=${encodeURIComponent(b.competenza)}`} className="bottone">
              Cerca un altro
            </Link>
            <Link href={`/bacheca/nuova?titolo=${encodeURIComponent(b.descrizione.slice(0, 100))}&competenza=${encodeURIComponent(b.competenza)}`} className="bottone fantasma">
              Pubblica in bacheca
            </Link>
          </div>
        </section>
      )}

      <div className="azioni-riga">
        {b.stato !== 'rifiutata' && b.stato !== 'annullata' && (
          <Link href={`/prenotazioni/${pid}/chat`} className="secondario">
            Scrivi a {primo}
          </Link>
        )}
        <Link
          href={`/segnala?tipo=problema_lavoro&oggetto=prenotazione&id=${pid}`}
          className="secondario"
        >
          Segnala un problema
        </Link>
      </div>
    </>
  )
}
