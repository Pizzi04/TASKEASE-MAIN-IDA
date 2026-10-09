import Link from 'next/link'
import { Testata } from '@/components/Testata'
import { IDA_MIN_LAVORI } from '@/lib/ida'
import { TITOLARE } from '@/lib/legale'

export const metadata = { title: 'Come funziona · TaskEase' }

const VOCI = [
  ['Trova chi ti serve', 'Cerca un mestiere o descrivi il problema. I risultati partono dai più vicini; puoi ordinarli per prezzo o per IDA.'],
  [
    'Fidati dell’IDA',
    `Un voto su 100 costruito solo dai lavori veri, giudicati da chi li ha ricevuti. Compare dopo ${IDA_MIN_LAVORI} lavori: prima si legge NUOVO. Gli ultimi 12 mesi contano per intero, da 12 a 24 mesi a metà. Non si compra e non decide chi compare per primo.`,
  ],
  ['Prenoti, la persona conferma', 'Invii la richiesta, chi lavora conferma o propone un altro orario. L’indirizzo lo vede solo dopo aver confermato.'],
  ['Paghi tra di voi', 'TaskEase non tocca i soldi: paghi le ore reali direttamente, contanti o come vi accordate.'],
  ['Lasci il giudizio', 'Cinque domande dopo il lavoro: puntualità, qualità, parola mantenuta, pulizia, comunicazione. Chi lavora può rispondere una volta.'],
  ['Chi lavora decide', 'Prezzi, orari, zone e quali lavori accettare. Rifiutare non abbassa l’IDA. TaskEase mette in contatto, non è il datore di lavoro di nessuno.'],
]

export default function Assistenza() {
  return (
    <>
      <Testata titolo="Come funziona" indietro="/" />
      {VOCI.map(([t, s]) => (
        <section key={t} className="scheda">
          <h2>{t}</h2>
          <p>{s}</p>
        </section>
      ))}
      <section className="scheda">
        <h2>Serve aiuto o vuoi contestare una decisione?</h2>
        <p>
          Scrivici a <b>{TITOLARE.email}</b> o su WhatsApp al <b>{TITOLARE.whatsapp}</b>. Rispondiamo in italiano entro 48 ore. Le
          contestazioni delle decisioni di moderazione sono gratuite e le riesamina una persona.
        </p>
      </section>
      <nav className="menu" aria-label="Documenti">
        <Link href="/legale/sicurezza">Consigli di sicurezza</Link>
        <Link href="/legale/giudizi">Come verifichiamo i giudizi</Link>
        <Link href="/legale/ranking">Come ordiniamo i risultati</Link>
        <Link href="/legale/termini">Termini d’uso</Link>
        <Link href="/legale/privacy">Informativa privacy</Link>
      </nav>
    </>
  )
}
