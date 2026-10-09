import Link from 'next/link'
import { Testata } from '@/components/Testata'
import { richiediAdmin } from '@/lib/supabase/server'

export const metadata = { title: 'Amministrazione · TaskEase' }

type Numeri = {
  dal: string
  iscritti: number
  iscritti_periodo: number
  professionisti: number
  professionisti_verificati: number
  prenotazioni_per_stato: Record<string, number>
  giudizi: number
  ida_medio: number | null
  post_aperti: number
  segnalazioni_aperte: number
  verifiche_in_attesa: number
  clienti_che_tornano: number
  eventi: Record<string, number>
  uscite: Record<string, number>
}

const FUNNEL: [string, string][] = [
  ['apertura', 'Aperture dell’app'],
  ['accesso_avviato', 'Accessi iniziati'],
  ['accesso_riuscito', 'Accessi riusciti'],
  ['profilo_creato', 'Profili creati'],
  ['ricerca', 'Ricerche'],
  ['scheda_vista', 'Schede viste'],
  ['prenotazione_avviata', 'Prenotazioni iniziate'],
  ['prenotazione_inviata', 'Prenotazioni inviate'],
  ['post_pubblicato', 'Richieste in bacheca'],
  ['proposta_inviata', 'Proposte in bacheca'],
  ['professionista_creato', 'Nuovi professionisti'],
  ['app_installata', 'App installate'],
]

export default async function Admin({ searchParams }: { searchParams: Promise<{ giorni?: string }> }) {
  const { supabase } = await richiediAdmin()
  const giorni = [7, 30, 90].includes(Number((await searchParams).giorni)) ? Number((await searchParams).giorni) : 30
  const { data } = await supabase.rpc('numeri', { p_giorni: giorni })
  const n = data as unknown as Numeri
  const stati = n.prenotazioni_per_stato
  const inviate = Object.values(stati).reduce((a, b) => a + b, 0)
  const completate = stati.completata ?? 0

  const Tessera = ({ v, l }: { v: number | string | null; l: string }) => (
    <div className="tessera">
      <b>{v ?? '—'}</b>
      <span>{l}</span>
    </div>
  )

  return (
    <>
      <Testata titolo="Amministrazione" indietro="/profilo" sotto={`Ultimi ${giorni} giorni`} />
      <nav className="chips" aria-label="Periodo">
        {[7, 30, 90].map((g) => (
          <Link key={g} href={`/admin?giorni=${g}`} className="chip" aria-current={g === giorni ? 'true' : undefined}>
            {g} giorni
          </Link>
        ))}
      </nav>

      <nav className="menu" aria-label="Da fare">
        <Link href="/admin/segnalazioni">
          Segnalazioni da decidere {n.segnalazioni_aperte ? <span className="pallino">{n.segnalazioni_aperte}</span> : null}
        </Link>
        <Link href="/admin/verifiche">
          Verifiche d’identità {n.verifiche_in_attesa ? <span className="pallino">{n.verifiche_in_attesa}</span> : null}
        </Link>
        <Link href="/admin/sospesi">Account sospesi</Link>
      </nav>

      <h2>Persone</h2>
      <div className="tessere">
        <Tessera v={n.iscritti} l="iscritti in tutto" />
        <Tessera v={n.iscritti_periodo} l="nuovi iscritti" />
        <Tessera v={n.professionisti} l="professionisti" />
        <Tessera v={n.professionisti_verificati} l="verificati" />
      </div>

      <h2>Lavori</h2>
      <div className="tessere">
        <Tessera v={inviate} l="prenotazioni" />
        <Tessera v={completate} l="completate" />
        <Tessera v={inviate ? `${Math.round((completate / inviate) * 100)}%` : '—'} l="arrivano in fondo" />
        <Tessera v={n.clienti_che_tornano} l="clienti tornati 2+ volte" />
        <Tessera v={n.giudizi} l="giudizi" />
        <Tessera v={n.ida_medio} l="IDA medio" />
        <Tessera v={n.post_aperti} l="richieste aperte in bacheca" />
      </div>
      <dl className="scheda dati">
        {Object.entries(stati).map(([k, v]) => (
          <div key={k} className="riga">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <h2>Percorso (eventi anonimi)</h2>
      <dl className="scheda dati">
        {FUNNEL.map(([k, l]) => (
          <div key={k} className="riga">
            <dt>{l}</dt>
            <dd>{n.eventi[k] ?? 0}</dd>
          </div>
        ))}
      </dl>

      {Object.keys(n.uscite).length > 0 && (
        <>
          <h2>Perché se ne vanno</h2>
          <dl className="scheda dati">
            {Object.entries(n.uscite).map(([k, v]) => (
              <div key={k} className="riga">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </>
  )
}
