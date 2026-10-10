import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Conta } from '@/components/Conta'
import { Icona } from '@/components/Icona'
import { Indietro } from '@/components/Indietro'
import { AvatarMestiere } from '@/components/RigaProfessionista'
import { etichettaGiorno, prossimiGiorni, quandoFa } from '@/lib/date'
import { registra } from '@/lib/eventi'
import { IDA_MIN_LAVORI, LIVELLI, VOCI, idaVisibile, livelloDi } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { ORARI, orarioPrenotabile } from '@/lib/validazione'
import { blocca, preferito } from './azioni'

export default async function SchedaProfessionista({ params }: { params: Promise<{ id: string }> }) {
  const { id: pro } = await params
  const { supabase, id } = await richiediProfilo()
  if (!/^[0-9a-f-]{36}$/.test(pro)) notFound()

  const [{ data: p }, { data: giudizi }, { data: pref }, { data: bloccato }, { data: occupati }] = await Promise.all([
    supabase
      .from('professionisti')
      .select('*, profili!professionisti_id_fkey!inner(nome, foto, in_pausa, creato_il)')
      .eq('id', pro)
      .maybeSingle(),
    supabase.rpc('giudizi_di', { p_professionista: pro }),
    supabase.from('preferiti').select('professionista').eq('utente', id).eq('professionista', pro).maybeSingle(),
    supabase.from('blocchi').select('bloccato').eq('utente', id).eq('bloccato', pro).maybeSingle(),
    supabase.rpc('orari_occupati', { p_professionista: pro }),
  ])
  if (!p) notFound()
  await registra(supabase, 'scheda_vista')

  const nome = p.profili.nome
  const primo = nome.split(' ')[0]
  const mia = pro === id
  const prenotabile = !mia && p.disponibile && !p.profili.in_pausa && !bloccato
  const lv = livelloDi(p.ida, p.giudizi)
  const ida = idaVisibile(p.ida, p.giudizi)
  const lista = giudizi ?? []
  const medie = VOCI.map((v) => ({
    ...v,
    media: lista.length ? lista.reduce((s, g) => s + Number(g[v.k]), 0) / lista.length : null,
  }))

  // Primo orario libero nei prossimi 14 giorni
  const presi = new Set((occupati ?? []).map((o) => `${o.giorno} ${o.ora.slice(0, 5)}`))
  let primoOrario: string | null = null
  for (const g of prossimiGiorni(14)) {
    const o = ORARI.find((ora) => orarioPrenotabile(g.iso, ora) && !presi.has(`${g.iso} ${ora}`))
    if (o) {
      primoOrario = `${etichettaGiorno(g.iso).toLowerCase()} alle ${o}`
      break
    }
  }

  return (
    <div className="pro-pagina">
      <div className="pro-barra">
        <Indietro ripiego="/cerca" />
        {!mia && (
          <form action={preferito}>
            <input type="hidden" name="professionista" value={pro} />
            <input type="hidden" name="azione" value={pref ? 'togli' : 'aggiungi'} />
            <button className={pref ? 'cuore on' : 'cuore'} type="submit" aria-pressed={!!pref} aria-label={pref ? 'Togli dai preferiti' : 'Salva tra i preferiti'}>
              <Icona nome="heart" lato={20} />
            </button>
          </form>
        )}
      </div>

      <div className="pro-testa2">
        <AvatarMestiere nome={nome} foto={p.profili.foto} competenze={p.competenze} lato={64} />
        <div>
          <p className="pro-k">
            {lv === 'bronzo' ? 'Profilo nuovo' : LIVELLI[lv].l} · {p.competenze[0]}
          </p>
          <h1 className="pro-h">{nome}</h1>
        </div>
      </div>
      {p.bio && <p className="pro-bio">{p.bio}</p>}
      <div className="facts">
        <span className={p.verificato ? 'ok' : ''}>
          <Icona nome="shield" lato={16} />
          {p.verificato ? 'Identità verificata' : 'Identità non ancora verificata'}
        </span>
        <span>
          <Icona nome="pin" lato={16} />
          {p.zone.join(', ')}
        </span>
        <span>
          <Icona nome="clock" lato={16} />
          su TaskEase da {new Date(p.profili.creato_il).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <p className="pro-tipo">{p.tipo === 'piva' ? 'Professionista con Partita IVA' : 'Privato · prestazione occasionale'}</p>

      {prenotabile ? (
        <div className="slot">
          <span>Primo orario proponibile</span>
          <b>{primoOrario ?? 'da concordare'}</b>
        </div>
      ) : (
        !mia && (
          <div className="slot no">
            <span>{bloccato ? 'Hai bloccato questa persona' : 'Ora non accetta prenotazioni'}</span>
            <b>{bloccato ? '—' : p.profili.in_pausa ? 'in pausa' : 'non disponibile'}</b>
          </div>
        )
      )}

      <section className="ida-block" aria-label="IDA">
        <div className="ida-hero">
          {ida != null ? (
            <b>
              <Conta a={ida} />
            </b>
          ) : (
            <b className="nuovo">NUOVO</b>
          )}
          <span>
            <strong>{ida != null ? 'IDA su 100' : 'IDA in costruzione'}</strong>
            <small>{ida != null ? `da ${p.giudizi} lavori giudicati dai clienti` : `compare dopo ${IDA_MIN_LAVORI} lavori giudicati`}</small>
          </span>
        </div>
        <ul className="voci-ida">
          {medie.map((v) => (
            <li key={v.k}>
              {v.l} <b>{v.media == null ? '—' : v.media.toFixed(1).replace('.', ',')}</b>
            </li>
          ))}
        </ul>
        <Link href="/legale/giudizi" className="ida-come">
          Come si calcola →
        </Link>
      </section>

      <div className="trio">
        <div>
          <b>{p.lavori}</b>
          <small>lavori fatti</small>
        </div>
        <div>
          <b>{p.su_preventivo ? 'prev.' : `${p.tariffa_oraria} €`}</b>
          <small>{p.su_preventivo ? 'su preventivo' : 'all’ora, finale'}</small>
        </div>
        <div>
          <b>{p.tipo === 'piva' ? 'P.IVA' : 'Privato'}</b>
          <small>{p.tipo === 'piva' ? 'con fattura' : 'occasionale'}</small>
        </div>
      </div>

      <div className="abilita">
        {p.competenze.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <p className="nota">
        Assicurazione RC {p.assicurazione_rc ? 'dichiarata' : 'non dichiarata'}
        {p.abilitazione_impianti ? ' · Abilitazione impianti dichiarata (DM 37/2008)' : ''}
        {p.tipo === 'privato' ? '. Con un privato non valgono recesso e garanzie del Codice del Consumo.' : '.'}
      </p>

      <section aria-label="Giudizi">
        <div className="sec-h">
          <h2>Cosa dicono</h2>
          <span className="nota">
            {p.giudizi} {p.giudizi === 1 ? 'giudizio' : 'giudizi'}
            {p.giudizi > lista.length ? ` · qui gli ultimi ${lista.length}` : ''}
          </span>
        </div>
        <p className="nota" style={{ marginTop: -6 }}>
          Solo giudizi di lavori conclusi su TaskEase. Nessuna recensione a pagamento.
        </p>
        {lista.length === 0 && (
          <p className="avviso">{mia ? 'Ancora nessun giudizio: arrivano dai clienti dopo i primi lavori.' : `Ancora nessun giudizio. Il primo lavoro con ${primo} può far partire il suo IDA.`}</p>
        )}
        {lista.map((g) => (
          <article key={g.prenotazione} className="rev">
            {g.commento ? <q>{g.commento}</q> : <p className="nota">Giudizio senza commento.</p>}
            <div className="rev-f">
              <span>
                <b>{g.punteggio}</b>
                {g.autore} · {g.competenza}
              </span>
              <span>{quandoFa(g.creato_il)}</span>
            </div>
            {g.risposta && (
              <p className="risposta">
                <b>{primo}:</b> {g.risposta}
              </p>
            )}
            {!mia && (
              <Link className="piccolo-link" href={`/segnala?tipo=contenuto&oggetto=giudizio&id=${g.prenotazione}`}>
                Segnala
              </Link>
            )}
          </article>
        ))}
      </section>

      {!mia && (
        <div className="azioni-riga centro">
          <Link className="piccolo-link" href={`/segnala?tipo=contenuto&oggetto=profilo&id=${pro}`}>
            Segnala il profilo
          </Link>
          {!bloccato && (
            <form action={blocca}>
              <input type="hidden" name="utente" value={pro} />
              <button className="piccolo-link pulsante-testo" type="submit">
                Blocca
              </button>
            </form>
          )}
        </div>
      )}
      <p className="nota centro">
        {mia ? 'I clienti vedono anche questa riga: ' : ''}TaskEase mette in contatto le persone. L’accordo e il lavoro restano tra te e {mia ? 'chi ti chiama' : primo}.
      </p>

      <div className="book-bar">
        <div className="book-prezzo">
          <span className="mono">{p.su_preventivo ? 'prev.' : `${p.tariffa_oraria}€/h`}</span>
          <small>{p.su_preventivo ? 'su preventivo' : 'prezzo finale'}</small>
        </div>
        {mia ? (
          <Link href="/lavoro/modifica" className="bottone">
            Modifica la tua scheda
          </Link>
        ) : prenotabile ? (
          <Link href={`/professionisti/${pro}/prenota`} className="bottone">
            Prenota {primo}
          </Link>
        ) : (
          <span className="bottone spento" aria-disabled="true">
            Non prenotabile
          </span>
        )}
      </div>
    </div>
  )
}
