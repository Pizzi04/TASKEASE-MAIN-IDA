import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SigilloEroe } from '@/components/SigilloEroe'
import { linkInterno } from '@/lib/link'
import { utenteCorrente } from '@/lib/supabase/server'
import ModuloAccesso from './modulo-accesso'

export const metadata = { title: 'Accedi · TaskEase' }

const MESTIERI = ['Idraulica', 'Montaggio mobili', 'Pulizie', 'Giardino', 'Elettricità', 'Tecnologia', 'Imbiancatura', 'Traslochi', 'Ripetizioni', 'Riparazioni']
const PASSI = [
  ['Scrivi cosa ti serve', 'Con parole tue: «perde il lavandino», «mi monti un armadio», «il WiFi non va».'],
  ['Scegli chi chiamare', 'Prima di decidere vedi quanto chiede all’ora, in che zona lavora e il suo IDA.'],
  ['Paghi a lavoro finito', 'Direttamente a chi ha fatto il lavoro, come vi accordate. TaskEase non prende commissioni.'],
]

export default async function Accedi({ searchParams }: { searchParams: Promise<{ eliminato?: string; da?: string }> }) {
  const { eliminato, da } = await searchParams
  const dopo = linkInterno(da)
  const { id } = await utenteCorrente()
  if (id) redirect(dopo)

  return (
    <div className="ent">
      <div className="ent-top rise">
        <span className="ent-mark">TaskEase</span>
        <span className="ent-pill">
          <span className="punto-vivo" aria-hidden="true" />
          Beta · Forlì-Cesena
        </span>
      </div>
      {eliminato && <p className="conferma">Account eliminato. Grazie per essere passato da TaskEase.</p>}

      <h1 className="ent-h rise" style={{ animationDelay: '.1s' }}>
        Trova chi ti aiuta,
        <br />
        <em>vicino a casa.</em>
      </h1>
      <p className="ent-sub rise" style={{ animationDelay: '.2s' }}>
        Idraulici, pulizie, montaggi e piccoli lavori. Persone della tua zona, con il voto dei clienti che le hanno già chiamate.
      </p>

      <div className="mq rise" style={{ animationDelay: '.3s' }} role="img" aria-label={'Mestieri: ' + MESTIERI.join(', ')}>
        <div className="mq-track" aria-hidden="true">
          {[...MESTIERI, ...MESTIERI].map((m, i) => (
            <span key={i} className="mq-chip">
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="ent-ida rise" style={{ animationDelay: '.4s' }}>
        <SigilloEroe />
        <div>
          <div className="ent-ida-t">Questo numero è l’IDA</div>
          <div className="ent-ida-s">Un voto su 100 su come lavora una persona. Lo danno i clienti dopo ogni lavoro, con 5 domande. Non si compra.</div>
        </div>
      </div>

      <section className="ent-accesso rise" style={{ animationDelay: '.5s' }} aria-labelledby="titolo-accesso">
        <h2 id="titolo-accesso">Entra con il tuo numero</h2>
        <p>Ti mandiamo un codice via SMS. Niente password da ricordare.</p>
        <ModuloAccesso dopo={dopo} />
        <p className="ent-note">
          Entrando accetti i <Link href="/legale/termini">Termini</Link> e confermi di aver letto l’<Link href="/legale/privacy">informativa privacy</Link>.
        </p>
      </section>

      <div className="ent-eyebrow">Come funziona</div>
      <ol className="ent-steps">
        {PASSI.map(([t, d], i) => (
          <li key={t} className="ent-step">
            <span className="ent-n">{i + 1}</span>
            <div>
              <div className="ent-pt">{t}</div>
              <div className="ent-ps">{d}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="ent-note">
        <Link href="/assistenza">Come funziona nel dettaglio</Link> · <Link href="/legale/info">Informazioni legali</Link>
      </p>
    </div>
  )
}
