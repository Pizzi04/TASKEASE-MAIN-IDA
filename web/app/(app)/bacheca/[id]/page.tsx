import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { EtichettaLivello } from '@/components/Sigillo'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { urlFoto } from '@/lib/foto'
import { richiediProfilo } from '@/lib/supabase/server'
import { cambiaStatoPost, proponi, ritira } from '../azioni'

export const metadata = { title: 'Richiesta · TaskEase' }

export default async function Richiesta({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pubblicata?: string }>
}) {
  const { id: idTesto } = await params
  const { pubblicata } = await searchParams
  const { supabase, id } = await richiediProfilo()
  const pid = Number(idTesto)
  if (!Number.isInteger(pid)) notFound()

  const { data: p } = await supabase
    .from('bacheca')
    .select('*, profili!bacheca_autore_fkey(nome)')
    .eq('id', pid)
    .maybeSingle()
  if (!p) notFound()
  const mia = p.autore === id

  const [{ data: proposte }, { data: scheda }] = await Promise.all([
    supabase
      .from('proposte')
      .select('id, messaggio, creato_il, professionista, professionisti!proposte_professionista_fkey(ida, giudizi, tariffa_oraria, verificato, profili!professionisti_id_fkey(nome))')
      .eq('post', pid)
      .order('creato_il'),
    supabase.from('professionisti').select('id').eq('id', id).maybeSingle(),
  ])
  const miaProposta = (proposte ?? []).find((x) => x.professionista === id)
  const foto = urlFoto(p.foto)

  return (
    <>
      <Testata titolo={p.titolo} indietro="/bacheca" sotto={`${p.profili?.nome.split(' ')[0] ?? ''} · ${p.zona} · ${quandoFa(p.creato_il)}`} />
      {pubblicata && <p className="conferma">Pubblicata. Chi lavora in zona la vede: ti avvisiamo quando qualcuno risponde.</p>}
      {p.stato === 'rimossa' && <p className="avviso">Questa richiesta è stata rimossa dalla moderazione.</p>}
      {p.dettagli && <p className="scheda descrizione">{p.dettagli}</p>}
      {foto && (
        <Image className="foto-post" src={foto} alt={`Foto: ${p.titolo}`} width={960} height={720} sizes="(max-width: 480px) 100vw, 480px" />
      )}
      {p.competenza && <p className="nota">Categoria: {p.competenza}</p>}

      {mia ? (
        <>
          <section aria-label="Risposte">
            <h2>Risposte ({proposte?.length ?? 0})</h2>
            {(proposte ?? []).length === 0 && <p className="vuoto">Ancora nessuna risposta. Ti avvisiamo appena arriva.</p>}
            {(proposte ?? []).map((x) => {
              const pr = x.professionisti
              const nome = pr?.profili?.nome ?? ''
              return (
                <article key={x.id} className="scheda">
                  <b>
                    {nome} {pr?.verificato ? '✓' : ''}
                  </b>{' '}
                  {pr && <EtichettaLivello ida={pr.ida} giudizi={pr.giudizi} />}
                  <p>{x.messaggio}</p>
                  <p className="nota">
                    {pr?.tariffa_oraria} € l’ora · {quandoFa(x.creato_il)}
                  </p>
                  <div className="azioni-riga">
                    <Link className="secondario" href={`/professionisti/${x.professionista}`}>
                      Vedi profilo
                    </Link>
                    {p.stato === 'aperta' && (
                      <Link className="bottone piccolo" href={`/professionisti/${x.professionista}/prenota?post=${pid}`}>
                        Prenota {nome.split(' ')[0]}
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
          {p.stato !== 'rimossa' && (
            <form action={cambiaStatoPost}>
              <input type="hidden" name="post" value={pid} />
              <input type="hidden" name="stato" value={p.stato === 'aperta' ? 'chiusa' : 'aperta'} />
              <button className="secondario" type="submit">
                {p.stato === 'aperta' ? 'Chiudi la richiesta (ho risolto)' : 'Riapri la richiesta'}
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          {scheda && p.stato === 'aperta' && !miaProposta && (
            <Modulo azione={proponi} invio="Invia la proposta" inCorso="Invio…">
              <input type="hidden" name="post" value={pid} />
              <label htmlFor="messaggio">La tua proposta</label>
              <textarea id="messaggio" name="messaggio" rows={3} maxLength={300} placeholder="Quando puoi passare, come lo faresti, quanto tempo serve." />
            </Modulo>
          )}
          {miaProposta && (
            <section className="scheda">
              <p>
                <b>La tua proposta:</b> {miaProposta.messaggio}
              </p>
              <form action={ritira}>
                <input type="hidden" name="post" value={pid} />
                <button className="secondario" type="submit">
                  Ritira la proposta
                </button>
              </form>
            </section>
          )}
          {!scheda && (
            <p className="nota">
              Sai farlo? <Link href="/lavoro/diventa">Crea la tua scheda</Link> per rispondere.
            </p>
          )}
          <Link className="piccolo-link" href={`/segnala?tipo=contenuto&oggetto=post&id=${pid}`}>
            Segnala questa richiesta
          </Link>
        </>
      )}
    </>
  )
}
