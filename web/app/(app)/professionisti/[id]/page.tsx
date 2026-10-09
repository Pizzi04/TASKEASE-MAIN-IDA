import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { EtichettaLivello, Sigillo } from '@/components/Sigillo'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { registra } from '@/lib/eventi'
import { IDA_MIN_LAVORI, VOCI } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { blocca, preferito } from './azioni'

export default async function SchedaProfessionista({ params }: { params: Promise<{ id: string }> }) {
  const { id: pro } = await params
  const { supabase, id } = await richiediProfilo()
  if (!/^[0-9a-f-]{36}$/.test(pro)) notFound()

  const [{ data: p }, { data: giudizi }, { data: pref }, { data: bloccato }] = await Promise.all([
    supabase
      .from('professionisti')
      .select('*, profili!professionisti_id_fkey!inner(nome, foto, in_pausa, creato_il)')
      .eq('id', pro)
      .maybeSingle(),
    supabase.rpc('giudizi_di', { p_professionista: pro }),
    supabase.from('preferiti').select('professionista').eq('utente', id).eq('professionista', pro).maybeSingle(),
    supabase.from('blocchi').select('bloccato').eq('utente', id).eq('bloccato', pro).maybeSingle(),
  ])
  if (!p) notFound()
  await registra(supabase, 'scheda_vista')

  const nome = p.profili.nome
  const mia = pro === id
  const prenotabile = !mia && p.disponibile && !p.profili.in_pausa && !bloccato
  const medie = VOCI.map((v) => ({
    ...v,
    media: giudizi && giudizi.length ? giudizi.reduce((s, g) => s + Number(g[v.k]), 0) / giudizi.length : null,
  }))

  return (
    <>
      <Testata titolo={nome} indietro="/cerca" />
      <section className="scheda pro-testa">
        <Avatar nome={nome} foto={p.profili.foto} lato={72} />
        <div>
          <EtichettaLivello ida={p.ida} giudizi={p.giudizi} />
          <p className="nota">
            {p.tipo === 'piva' ? 'Professionista con Partita IVA' : 'Privato (prestazione occasionale)'}
            {p.verificato ? ' · ✓ Identità verificata' : ' · Identità non ancora verificata'}
          </p>
          <p className="nota">
            {p.lavori} lavori su TaskEase · su TaskEase da {new Date(p.profili.creato_il).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Sigillo ida={p.ida} giudizi={p.giudizi} grande />
      </section>

      {p.bio && <p className="bio">{p.bio}</p>}

      <dl className="scheda dati">
        <div className="riga">
          <dt>Tariffa</dt>
          <dd>{p.su_preventivo ? 'Su preventivo' : `${p.tariffa_oraria} € l’ora`}</dd>
        </div>
        <div className="riga">
          <dt>Fa</dt>
          <dd>{p.competenze.join(', ')}</dd>
        </div>
        <div className="riga">
          <dt>Zone</dt>
          <dd>{p.zone.join(', ')}</dd>
        </div>
        {p.abilitazione_impianti && (
          <div className="riga">
            <dt>Impianti</dt>
            <dd>Abilitazione dichiarata (DM 37/2008)</dd>
          </div>
        )}
        <div className="riga">
          <dt>Assicurazione RC</dt>
          <dd>{p.assicurazione_rc ? 'Dichiarata' : 'Non dichiarata'}</dd>
        </div>
      </dl>
      {p.tipo === 'privato' && (
        <p className="nota">Con un privato non valgono recesso e garanzie del Codice del Consumo.</p>
      )}

      {prenotabile ? (
        <Link href={`/professionisti/${pro}/prenota`} className="bottone">
          Prenota {nome.split(' ')[0]}
        </Link>
      ) : (
        !mia && <p className="avviso">{bloccato ? 'Hai bloccato questa persona.' : 'Ora non accetta prenotazioni.'}</p>
      )}
      {mia && (
        <Link href="/lavoro/modifica" className="bottone">
          Modifica la tua scheda
        </Link>
      )}

      {!mia && (
        <div className="azioni-riga">
          <form action={preferito}>
            <input type="hidden" name="professionista" value={pro} />
            <input type="hidden" name="azione" value={pref ? 'togli' : 'aggiungi'} />
            <button className="secondario" type="submit" aria-pressed={!!pref}>
              {pref ? '♥ Nei preferiti' : '♡ Aggiungi ai preferiti'}
            </button>
          </form>
          <Link className="secondario" href={`/segnala?tipo=contenuto&oggetto=profilo&id=${pro}&chi=${pro}`}>
            Segnala il profilo
          </Link>
          {!bloccato && (
            <form action={blocca}>
              <input type="hidden" name="utente" value={pro} />
              <button className="secondario pericolo-testo" type="submit">
                Blocca
              </button>
            </form>
          )}
        </div>
      )}

      <section aria-label="Giudizi">
        <h2>Giudizi ({giudizi?.length ?? 0})</h2>
        {p.giudizi < IDA_MIN_LAVORI && (
          <p className="nota">
            L’IDA compare dopo {IDA_MIN_LAVORI} lavori giudicati. <Link href="/legale/giudizi">Come verifichiamo i giudizi</Link>
          </p>
        )}
        {giudizi && giudizi.length > 0 && (
          <dl className="scheda voci">
            {medie.map((v) => (
              <div key={v.k} className="riga">
                <dt>{v.l}</dt>
                <dd>{v.media == null ? '—' : v.media.toFixed(1).replace('.', ',') + ' / 5'}</dd>
              </div>
            ))}
          </dl>
        )}
        {(giudizi ?? []).map((g) => (
          <article key={g.prenotazione} className="scheda giudizio">
            <header>
              <b>{g.autore}</b> · {g.competenza} · {quandoFa(g.creato_il)}
              <span className="punteggio">{g.punteggio}</span>
            </header>
            {g.commento && <p>{g.commento}</p>}
            {g.risposta && (
              <p className="risposta">
                <b>Risposta di {nome.split(' ')[0]}:</b> {g.risposta}
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
    </>
  )
}
