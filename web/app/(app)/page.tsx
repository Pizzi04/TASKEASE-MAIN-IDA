import Link from 'next/link'
import { COLONNE_PRO, RigaProfessionista, daRiga } from '@/components/RigaProfessionista'
import { Sigillo, EtichettaLivello } from '@/components/Sigillo'
import { etichettaGiorno, oraBreve } from '@/lib/date'
import { registra } from '@/lib/eventi'
import { richiediProfilo, type Db } from '@/lib/supabase/server'
import { adessoARoma } from '@/lib/validazione'
import { ordina } from '@/lib/zone'
import { cambiaRuolo } from './azioni'

const CATEGORIE = ['Riparazioni', 'Pulizie', 'Montaggio mobili', 'Tecnologia / PC', 'Giardino', 'Tuttofare']

export default async function Home() {
  const { supabase, id, profilo } = await richiediProfilo()
  const lavoro = profilo.ruolo === 'worker'
  const oggi = adessoARoma().giorno
  await registra(supabase, 'apertura')

  return (
    <>
      <h1 className="saluto">Ciao {profilo.nome.split(' ')[0]}</h1>

      <form action={cambiaRuolo} className="ruolo" aria-label="Cosa vuoi fare">
        <button name="ruolo" value="client" aria-pressed={!lavoro} type="submit">
          Cerco aiuto
        </button>
        <button name="ruolo" value="worker" aria-pressed={lavoro} type="submit">
          Lavoro
        </button>
      </form>

      {lavoro ? <HomeLavoro supabase={supabase} id={id} oggi={oggi} /> : <HomeCliente supabase={supabase} id={id} zona={profilo.zona} oggi={oggi} />}
    </>
  )
}

async function HomeCliente({ supabase, id, zona, oggi }: { supabase: Db; id: string; zona: string; oggi: string }) {
  const [prossime, vicini, preferiti] = await Promise.all([
    supabase
      .from('prenotazioni')
      .select('id, giorno, ora, stato, competenza, controproposta, professionisti!prenotazioni_professionista_fkey(profili!professionisti_id_fkey(nome))')
      .eq('cliente', id)
      .in('stato', ['richiesta', 'confermata'])
      .gte('giorno', oggi)
      .order('giorno')
      .order('ora')
      .limit(2),
    supabase.from('professionisti').select(COLONNE_PRO).eq('disponibile', true).eq('profili.in_pausa', false).limit(200),
    supabase.from('preferiti').select(`professionista, professionisti!preferiti_professionista_fkey(${COLONNE_PRO})`).eq('utente', id).limit(6),
  ])
  const tutti = (vicini.data ?? []).map(daRiga).filter((p) => p.id !== id)
  const primi = ordina(tutti, zona, 'vicini').slice(0, 3)
  const miei = (preferiti.data ?? []).flatMap((r) => (r.professionisti ? [daRiga(r.professionisti)] : []))

  return (
    <>
      <form action="/cerca" className="cerca" role="search">
        <label htmlFor="q" className="nascosto">
          Cosa ti serve?
        </label>
        <input id="q" name="q" type="search" placeholder="Cosa ti serve? Es. tapparella bloccata" />
        <button type="submit" className="bottone piccolo">
          Cerca
        </button>
      </form>
      <div className="chips" aria-label="Categorie">
        {CATEGORIE.map((c) => (
          <Link key={c} href={`/cerca?competenza=${encodeURIComponent(c)}`} className="chip">
            {c}
          </Link>
        ))}
      </div>

      {(prossime.data ?? []).length > 0 && (
        <section aria-label="Prossimi appuntamenti">
          <h2>I tuoi prossimi appuntamenti</h2>
          {(prossime.data ?? []).map((b) => (
            <Link key={b.id} href={`/prenotazioni/${b.id}`} className="scheda link-scheda">
              <b>
                {etichettaGiorno(b.giorno)} alle {oraBreve(b.ora)}
              </b>
              <span>
                {b.competenza} con {b.professionisti?.profili?.nome ?? '—'}
              </span>
              <span className={b.stato === 'confermata' ? 'stato ok' : 'stato'}>
                {b.stato === 'confermata' ? 'Confermata' : b.controproposta ? 'Nuovo orario proposto: rispondi' : 'In attesa di conferma'}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section aria-label="Vicino a te">
        <h2>Disponibili vicino a te</h2>
        {primi.length === 0 ? (
          <p className="vuoto">Ancora nessuno disponibile in zona. Prova a pubblicare una richiesta in bacheca.</p>
        ) : (
          primi.map((p) => <RigaProfessionista key={p.id} p={p} />)
        )}
        <div className="azioni-riga">
          <Link href="/cerca" className="secondario">
            Vedi tutti
          </Link>
          <Link href="/bacheca/nuova" className="secondario">
            Pubblica una richiesta
          </Link>
        </div>
      </section>

      {miei.length > 0 && (
        <section aria-label="Preferiti">
          <h2>I tuoi preferiti</h2>
          {miei.map((p) => (
            <RigaProfessionista key={p.id} p={p} />
          ))}
        </section>
      )}
    </>
  )
}

async function HomeLavoro({ supabase, id, oggi }: { supabase: Db; id: string; oggi: string }) {
  const [scheda, richieste, agenda] = await Promise.all([
    supabase.from('professionisti').select('ida, giudizi, lavori, disponibile, verificato, zone').eq('id', id).maybeSingle(),
    supabase
      .from('prenotazioni')
      .select('id, giorno, ora, competenza, descrizione, zona, controproposta, profili!prenotazioni_cliente_fkey(nome)')
      .eq('professionista', id)
      .eq('stato', 'richiesta')
      .order('giorno')
      .limit(10),
    supabase
      .from('prenotazioni')
      .select('id, giorno, ora, competenza, zona, profili!prenotazioni_cliente_fkey(nome)')
      .eq('professionista', id)
      .eq('stato', 'confermata')
      .gte('giorno', oggi)
      .order('giorno')
      .order('ora')
      .limit(5),
  ])
  const s = scheda.data
  if (!s) {
    return (
      <section className="scheda">
        <h2>Inizia a lavorare</h2>
        <p>Crea la tua scheda: competenze, tariffa, zone. Ci vogliono 3 minuti.</p>
        <Link href="/lavoro/diventa" className="bottone">
          Crea la scheda
        </Link>
      </section>
    )
  }
  const { count: inBacheca } = await supabase
    .from('bacheca')
    .select('id', { count: 'exact', head: true })
    .eq('stato', 'aperta')
    .in('zona', s.zone)

  return (
    <>
      <section className="scheda riga-ida">
        <Sigillo ida={s.ida} giudizi={s.giudizi} grande />
        <div>
          <EtichettaLivello ida={s.ida} giudizi={s.giudizi} />
          <p>
            {s.lavori} lavori fatti · {s.giudizi} giudizi
          </p>
          <p className={s.disponibile ? 'stato ok' : 'stato'}>{s.disponibile ? 'Disponibile' : 'Non disponibile'}</p>
          {!s.verificato && (
            <Link href="/lavoro/verifica" className="secondario">
              Verifica la tua identità
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Richieste da confermare">
        <h2>Richieste da confermare</h2>
        {(richieste.data ?? []).length === 0 ? (
          <p className="vuoto">Nessuna richiesta in attesa.</p>
        ) : (
          (richieste.data ?? []).map((b) => (
            <Link key={b.id} href={`/prenotazioni/${b.id}`} className="scheda link-scheda">
              <b>
                {b.profili?.nome.split(' ')[0]} · {etichettaGiorno(b.giorno)} alle {oraBreve(b.ora)}
              </b>
              <span>{b.descrizione}</span>
              <span className="stato">{b.controproposta ? 'Hai proposto un altro orario' : `${b.competenza} · ${b.zona}`}</span>
            </Link>
          ))
        )}
      </section>

      <section aria-label="Agenda">
        <h2>Prossimi lavori</h2>
        {(agenda.data ?? []).length === 0 ? (
          <p className="vuoto">Niente in agenda.</p>
        ) : (
          (agenda.data ?? []).map((b) => (
            <Link key={b.id} href={`/prenotazioni/${b.id}`} className="scheda link-scheda">
              <b>
                {etichettaGiorno(b.giorno)} alle {oraBreve(b.ora)}
              </b>
              <span>
                {b.competenza} · {b.profili?.nome.split(' ')[0]} · {b.zona}
              </span>
            </Link>
          ))
        )}
      </section>

      <Link href="/bacheca" className="scheda link-scheda">
        <b>Bacheca</b>
        <span>{inBacheca ?? 0} richieste aperte nelle tue zone</span>
      </Link>
    </>
  )
}
