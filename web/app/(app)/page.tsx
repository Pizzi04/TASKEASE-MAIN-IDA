import Link from 'next/link'
import { Campanella } from '@/components/Campanella'
import { Conta } from '@/components/Conta'
import { Icona } from '@/components/Icona'
import { MappaZona } from '@/components/MappaZona'
import { COLONNE_PRO, RigaProfessionista, daRiga } from '@/components/RigaProfessionista'
import { CATEGORIE, saluto } from '@/lib/categorie'
import { etichettaGiorno, oraBreve } from '@/lib/date'
import { registra } from '@/lib/eventi'
import { IDA_MIN_LAVORI, idaVisibile } from '@/lib/ida'
import { richiediProfilo, type Db } from '@/lib/supabase/server'
import { adessoARoma } from '@/lib/validazione'
import { ordina } from '@/lib/zone'
import { cambiaRuolo } from './azioni'

export default async function Home() {
  const { supabase, id, profilo } = await richiediProfilo()
  const lavoro = profilo.ruolo === 'worker'
  const { giorno: oggi, minuti } = adessoARoma()
  const nome = profilo.nome.split(' ')[0]
  const [{ count: nonLette }] = await Promise.all([
    supabase.from('notifiche').select('id', { count: 'exact', head: true }).eq('utente', id).eq('letta', false),
    registra(supabase, 'apertura'),
  ])

  return (
    <>
      <header>
        <div className="home-top">
          <div>
            <Link href="/" className="marchio">
              TaskEase
            </Link>
            <div className="home-sub">
              <span className="punto-vivo" aria-hidden="true" />
              Zona {profilo.zona}
            </div>
          </div>
          <div className="home-azioni">
            <form action={cambiaRuolo} className="ruolo" aria-label="Cosa vuoi fare">
              <button name="ruolo" value="client" aria-pressed={!lavoro} type="submit">
                Cerco
              </button>
              <button name="ruolo" value="worker" aria-pressed={lavoro} type="submit">
                Lavoro
              </button>
            </form>
            <Campanella key={nonLette ?? 0} utente={id} iniziali={nonLette ?? 0} />
          </div>
        </div>
        <h1 className="home-h">
          {saluto(Math.floor(minuti / 60))}, {nome}.
          <br />
          <em>{lavoro ? 'Chi aiutiamo oggi?' : 'Chi ti serve oggi?'}</em>
        </h1>
      </header>

      {lavoro ? <HomeLavoro supabase={supabase} id={id} oggi={oggi} /> : <HomeCliente supabase={supabase} id={id} zona={profilo.zona} oggi={oggi} />}
    </>
  )
}

async function HomeCliente({ supabase, id, zona, oggi }: { supabase: Db; id: string; zona: string; oggi: string }) {
  const [prossime, vicini, preferiti, bacheca] = await Promise.all([
    supabase
      .from('prenotazioni')
      .select('id, giorno, ora, stato, competenza, controproposta, professionisti!prenotazioni_professionista_fkey(profili!professionisti_id_fkey(nome))')
      .eq('cliente', id)
      .in('stato', ['richiesta', 'confermata'])
      .gte('giorno', oggi)
      .order('giorno')
      .order('ora')
      .limit(1),
    supabase.from('professionisti').select(COLONNE_PRO).eq('profili.in_pausa', false).limit(200),
    supabase.from('preferiti').select(`professionista, professionisti!preferiti_professionista_fkey(${COLONNE_PRO})`).eq('utente', id).limit(6),
    supabase.from('bacheca').select('id', { count: 'exact', head: true }).eq('stato', 'aperta'),
  ])
  const tutti = (vicini.data ?? []).map(daRiga).filter((p) => p.id !== id)
  const primi = ordina(
    tutti.filter((p) => p.disponibile),
    zona,
    'vicini',
  ).slice(0, 3)
  const miei = (preferiti.data ?? []).flatMap((r) => (r.professionisti ? [daRiga(r.professionisti)] : []))
  const prossima = prossime.data?.[0]
  const inBacheca = bacheca.count ?? 0

  return (
    <>
      <form action="/cerca" className="campo" role="search">
        <Icona nome="search" lato={20} />
        <label htmlFor="q" className="nascosto">
          Cosa ti serve?
        </label>
        <input id="q" name="q" type="search" placeholder="Cosa ti serve? Anche solo una mano" />
      </form>

      <nav className="cats" aria-label="Mestieri">
        {CATEGORIE.map((c) => (
          <Link key={c.n} href={`/cerca?competenza=${encodeURIComponent(c.n)}`} className="cat2">
            <Icona nome={c.ic} lato={18} colore={c.c} />
            {c.n}
          </Link>
        ))}
      </nav>

      <div className="bento">
        {prossima ? (
          <Link href={`/prenotazioni/${prossima.id}`} className="tl next">
            <span className="tm">{oraBreve(prossima.ora)}</span>
            <div>
              {prossima.professionisti?.profili?.nome ?? prossima.competenza}
              <small>
                {etichettaGiorno(prossima.giorno)} · {prossima.stato === 'confermata' ? 'confermato' : prossima.controproposta ? 'nuovo orario: rispondi' : 'in attesa di conferma'}
              </small>
            </div>
            <Icona nome="arrowR" lato={18} />
          </Link>
        ) : (
          <Link href="/prenotazioni" className="tl next">
            <Icona nome="cal" lato={22} />
            <div>
              Le tue prenotazioni
              <small>Nessun appuntamento in arrivo</small>
            </div>
            <Icona nome="arrowR" lato={18} />
          </Link>
        )}
        <MappaZona persone={tutti} mia={zona} />
        <Link href="/legale/giudizi" className="tl ida">
          <small>Cos’è l’IDA</small>
          <span className="big">
            <Conta a={5} ms={500} />
          </span>
          <span className="sub">domande dopo ogni lavoro: un voto su 100 che non si compra</span>
        </Link>
        <Link href="/bacheca" className="tl">
          <small>Bacheca</small>
          <span className="big" style={{ fontSize: 30 }}>
            <Conta a={inBacheca} ms={600} />
          </span>
          <span className="sub">{inBacheca === 1 ? 'richiesta aperta' : 'richieste aperte'}</span>
        </Link>
      </div>

      <div className="sec-h">
        <h2>Vicini a te</h2>
        <Link href="/cerca">Vedi tutti</Link>
      </div>
      {primi.length === 0 ? (
        <p className="vuoto">
          Ancora nessuno disponibile in zona. <Link href="/bacheca/nuova">Pubblica una richiesta</Link>: rispondono le persone che lavorano qui vicino.
        </p>
      ) : (
        <div className="wlist">
          {primi.map((p, i) => (
            <RigaProfessionista key={p.id} p={p} indice={i} />
          ))}
        </div>
      )}

      {miei.length > 0 && (
        <>
          <div className="sec-h">
            <h2>I tuoi preferiti</h2>
            <Link href="/profilo/preferiti">Tutti</Link>
          </div>
          <div className="wlist">
            {miei.slice(0, 3).map((p, i) => (
              <RigaProfessionista key={p.id} p={p} indice={i} />
            ))}
          </div>
        </>
      )}

      <ul className="tiles">
        <li>
          <Link href="/prenotazioni" className="tile">
            <Icona nome="cal" lato={20} />
            <span className="tile-l">Prenotazioni</span>
            <span className="tile-s">storico e agenda</span>
          </Link>
        </li>
        <li>
          <Link href="/passaporto" className="tile">
            <Icona nome="pin" lato={20} />
            <span className="tile-l">Passaporto</span>
            <span className="tile-s">i tuoi timbri</span>
          </Link>
        </li>
        <li>
          <Link href="/assistenza" className="tile">
            <Icona nome="book" lato={20} />
            <span className="tile-l">Come funziona</span>
            <span className="tile-s">regole e IDA</span>
          </Link>
        </li>
      </ul>
    </>
  )
}

async function HomeLavoro({ supabase, id, oggi }: { supabase: Db; id: string; oggi: string }) {
  const [scheda, richieste, agenda] = await Promise.all([
    supabase.from('professionisti').select('ida, giudizi, lavori, disponibile, verificato, zone, tariffa_oraria').eq('id', id).maybeSingle(),
    supabase
      .from('prenotazioni')
      .select('id, giorno, ora, ore, competenza, descrizione, zona, controproposta, profili!prenotazioni_cliente_fkey(nome)')
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
      <>
        <Link href="/lavoro/diventa" className="home-cta">
          <Icona nome="bolt" lato={20} />
          <span>Crea la tua scheda: 3 minuti</span>
          <Icona nome="arrowR" lato={18} />
        </Link>
        <Link href="/legale/giudizi" className="ida-card">
          <b>Come funziona l’IDA</b>
          Un voto su 100 fatto solo di lavori veri: 5 domande dopo ogni lavoro, regole pubbliche.
          <br />
          <span>Come si calcola →</span>
        </Link>
      </>
    )
  }
  const { count: inBacheca } = await supabase.from('bacheca').select('id', { count: 'exact', head: true }).eq('stato', 'aperta').in('zona', s.zone)
  const lista = richieste.data ?? []
  const prossimo = agenda.data?.[0]
  const ida = idaVisibile(s.ida, s.giudizi)

  return (
    <>
      <Link href="/lavoro" className="home-cta">
        <Icona nome="bolt" lato={20} />
        <span>{lista.length ? `${lista.length} ${lista.length === 1 ? 'richiesta ti aspetta' : 'richieste ti aspettano'}` : 'Il tuo profilo e l’agenda'}</span>
        <Icona nome="arrowR" lato={18} />
      </Link>

      <div className="bento">
        {prossimo && (
          <Link href={`/prenotazioni/${prossimo.id}`} className="tl next">
            <span className="tm">{oraBreve(prossimo.ora)}</span>
            <div>
              {prossimo.competenza} · {prossimo.profili?.nome.split(' ')[0]}
              <small>
                {etichettaGiorno(prossimo.giorno)} · {prossimo.zona}
              </small>
            </div>
            <Icona nome="arrowR" lato={18} />
          </Link>
        )}
        <Link href="/lavoro/giudizi" className="tl ida">
          <small>Il tuo IDA</small>
          <span className="big">{ida != null ? <Conta a={ida} /> : <span style={{ fontSize: 18, letterSpacing: 1 }}>NUOVO</span>}</span>
          <span className="sub">{ida != null ? `da ${s.giudizi} giudizi` : `compare dopo ${IDA_MIN_LAVORI} lavori giudicati`}</span>
        </Link>
        <Link href="/bacheca" className="tl">
          <small>Bacheca</small>
          <span className="big" style={{ fontSize: 30 }}>
            <Conta a={inBacheca ?? 0} ms={600} />
          </span>
          <span className="sub">richieste nelle tue zone</span>
        </Link>
      </div>

      <div className="sec-h">
        <h2>Richieste per te</h2>
        <Link href="/prenotazioni?vista=lavoro">Vedi tutte</Link>
      </div>
      <div className="wlist">
        {lista.length === 0 && (
          <p className="vuoto scheda">{s.disponibile ? 'Nessuna richiesta per ora. Ti avvisiamo quando ne arriva una.' : 'Non sei disponibile: non ti arrivano richieste. Accendi «Disponibile» in Lavoro.'}</p>
        )}
        {lista.slice(0, 3).map((b, i) => (
          <Link key={b.id} href={`/prenotazioni/${b.id}`} className="wcard solo" style={{ animationDelay: `${i * 0.05}s` }}>
            <span className="wcard-b">
              <span className="wcard-n">{b.competenza}</span>
              <span className="wcard-bio">
                {b.profili?.nome.split(' ')[0]} · {b.zona} · {etichettaGiorno(b.giorno)}, {oraBreve(b.ora)}
              </span>
            </span>
            <span className="wcard-r">
              {b.ore ? (
                <>
                  <span className="ida-n" style={{ fontSize: 20 }}>
                    ~{b.ore * s.tariffa_oraria}€
                  </span>
                  <span className="ida-lab">
                    {b.ore} h × {s.tariffa_oraria} €
                  </span>
                </>
              ) : (
                <span className="ida-lab">durata da stimare</span>
              )}
            </span>
            <span className="wcard-tags">
              <span className="taglia" style={{ whiteSpace: 'normal' }}>
                {b.descrizione}
              </span>
              <span style={{ color: 'var(--ochre-light)' }}>{b.controproposta ? 'Hai proposto un altro orario' : 'Vedi la richiesta'}</span>
            </span>
          </Link>
        ))}
      </div>

      {!s.verificato && (
        <Link href="/lavoro/verifica" className="ida-card">
          <b>Verifica la tua identità</b>
          Chi ha il badge “verificato” viene scelto più spesso. Lo facciamo in videochiamata o di persona.
          <br />
          <span>Chiedi la verifica →</span>
        </Link>
      )}

      <ul className="tiles">
        <li>
          <Link href={`/professionisti/${id}`} className="tile">
            <Icona nome="user" lato={20} />
            <span className="tile-l">La tua scheda</span>
            <span className="tile-s">come ti vedono</span>
          </Link>
        </li>
        <li>
          <Link href="/bacheca" className="tile">
            <Icona nome="grid" lato={20} />
            <span className="tile-l">Bacheca</span>
            <span className="tile-s">chi cerca in zona</span>
          </Link>
        </li>
        <li>
          <Link href="/lavoro/giudizi" className="tile">
            <Icona nome="seal" lato={20} />
            <span className="tile-l">Giudizi</span>
            <span className="tile-s">e risposte</span>
          </Link>
        </li>
      </ul>
    </>
  )
}
