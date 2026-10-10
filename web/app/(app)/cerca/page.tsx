import Link from 'next/link'
import { Icona } from '@/components/Icona'
import { COLONNE_PRO, daRiga } from '@/components/RigaProfessionista'
import { CATEGORIE } from '@/lib/categorie'
import { registra } from '@/lib/eventi'
import { idaVisibile } from '@/lib/ida'
import { richiediProfilo } from '@/lib/supabase/server'
import { COMPETENZE, ZONE } from '@/lib/validazione'
import { distanza, ordina, type Ordine } from '@/lib/zone'

export const metadata = { title: 'Cerca · TaskEase' }

// Parole comuni → competenza, così "tapparella" trova chi fa riparazioni
const SINONIMI: [RegExp, string][] = [
  [/tubo|perdita|scarico|lavandino|rubinett|wc|water|caldaia/i, 'Idraulica'],
  [/presa|interruttor|luce|lampadari|corrente|salvavita/i, 'Elettricità'],
  [/tapparell|serratur|porta|finestr|cerniera|maniglia/i, 'Riparazioni'],
  [/pulizi|pulire|vetri|stirar/i, 'Pulizie'],
  [/mobil|ikea|armadio|montar|mensol|libreria|cucina/i, 'Montaggio mobili'],
  [/pc|computer|wifi|wi-fi|stampant|router|telefono|tablet/i, 'Tecnologia / PC'],
  [/giardin|prato|siepe|potar|erba|alber/i, 'Giardino'],
  [/imbianc|pittur|pareti|tinteggi/i, 'Imbiancatura'],
  [/piastrell|pavimen|fughe/i, 'Piastrelle e pavimenti'],
  [/trasloc|spostare|scatolon/i, 'Traslochi'],
  [/consegn|ritir|portare/i, 'Consegne'],
  [/ripetizion|lezion|compiti|matematica|inglese/i, 'Ripetizioni'],
  [/muro|cartongesso|crepa|intonaco/i, 'Muratura e cartongesso'],
]

export default async function Cerca({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; competenza?: string; zona?: string; ordine?: string; tutti?: string }>
}) {
  const { supabase, id, profilo } = await richiediProfilo()
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const competenza = (COMPETENZE as readonly string[]).includes(sp.competenza ?? '') ? sp.competenza! : ''
  const zona = (ZONE as readonly string[]).includes(sp.zona ?? '') ? sp.zona! : ''
  const ordine: Ordine = sp.ordine === 'prezzo' || sp.ordine === 'ida' ? sp.ordine : 'vicini'
  const ancheNonDisponibili = sp.tutti === '1'
  const daQ = q ? SINONIMI.find(([re]) => re.test(q))?.[1] : undefined

  let query = supabase.from('professionisti').select(COLONNE_PRO).eq('profili.in_pausa', false).limit(300)
  if (competenza) query = query.contains('competenze', [competenza])
  if (zona) query = query.contains('zone', [zona])
  if (!ancheNonDisponibili) query = query.eq('disponibile', true)

  const [{ data }, { data: blocchi }] = await Promise.all([query, supabase.from('blocchi').select('bloccato').eq('utente', id)])
  if (q || competenza) await registra(supabase, 'ricerca')

  const bloccati = new Set((blocchi ?? []).map((b) => b.bloccato))
  let lista = (data ?? []).map(daRiga).filter((p) => p.id !== id && !bloccati.has(p.id))
  // Il testo filtra anche con un mestiere scelto, tranne quando descrive proprio quel mestiere ("tapparella" + Riparazioni)
  if (q && !(competenza && daQ === competenza)) {
    const parola = q.toLowerCase()
    lista = lista.filter(
      (p) =>
        p.nome.toLowerCase().includes(parola) ||
        p.competenze.some((c) => c.toLowerCase().includes(parola) || (!competenza && c === daQ)),
    )
  }
  lista = ordina(lista, profilo.zona, ordine)

  const link = (cambia: Record<string, string>) => {
    const p = new URLSearchParams({ q, competenza, zona, ordine, tutti: ancheNonDisponibili ? '1' : '', ...cambia })
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k)
    return `/cerca?${p}`
  }
  const colonne = [
    ['ida', 'IDA'],
    ['prezzo', '€/h'],
    ['vicini', 'km ≈'],
  ] as const

  return (
    <>
      <div className="testata cerca-testa">
        <Link href="/" className="indietro" aria-label="Indietro">
          <Icona nome="arrowL" lato={20} />
        </Link>
        <form className="campo" role="search">
          <Icona nome="search" lato={18} />
          <label htmlFor="q" className="nascosto">
            Cerca un mestiere o descrivi il problema
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Idraulico, pulizie, WiFi, montaggio…" />
          {competenza && <input type="hidden" name="competenza" value={competenza} />}
          {zona && <input type="hidden" name="zona" value={zona} />}
          <input type="hidden" name="ordine" value={ordine} />
          {ancheNonDisponibili && <input type="hidden" name="tutti" value="1" />}
        </form>
      </div>
      <h1 className="nascosto">Cerca</h1>

      <nav className="cats" aria-label="Mestieri">
        <Link href={link({ competenza: '' })} className="cat2" aria-current={!competenza ? 'true' : undefined}>
          Tutti
        </Link>
        {CATEGORIE.map((c) => (
          <Link key={c.n} href={link({ competenza: competenza === c.n ? '' : c.n })} className="cat2" aria-current={competenza === c.n ? 'true' : undefined}>
            <Icona nome={c.ic} lato={18} colore={competenza === c.n ? '#1C1408' : c.c} />
            {c.n}
          </Link>
        ))}
        {COMPETENZE.filter((n) => !CATEGORIE.some((c) => c.n === n)).map((n) => (
          <Link key={n} href={link({ competenza: competenza === n ? '' : n })} className="cat2" aria-current={competenza === n ? 'true' : undefined}>
            {n}
          </Link>
        ))}
      </nav>
      <nav className="cats" aria-label="Zona">
        <Link href={link({ zona: '' })} className="cat2 zona" aria-current={!zona ? 'true' : undefined}>
          Tutte le zone
        </Link>
        {ZONE.map((z) => (
          <Link key={z} href={link({ zona: zona === z ? '' : z })} className="cat2 zona" aria-current={zona === z ? 'true' : undefined}>
            {z}
          </Link>
        ))}
      </nav>

      {daQ && !competenza && (
        <p className="nota forse">
          Forse cerchi <Link href={link({ competenza: daQ, q: '' })}>{daQ}</Link>?
        </p>
      )}

      <p className="cerca-meta" aria-live="polite">
        <b>{lista.length === 0 ? 'Nessuno' : `${lista.length} ${lista.length === 1 ? 'persona' : 'persone'}`}</b> · nessuno paga per apparire ·{' '}
        <Link href="/legale/ranking">come ordiniamo</Link> ·{' '}
        <Link href={link({ tutti: ancheNonDisponibili ? '' : '1' })}>{ancheNonDisponibili ? 'solo disponibili' : 'anche non disponibili'}</Link>
        {lista.some((p) => distanza(profilo.zona, p.zone) >= 1000) && <> · “—” = distanza non stimabile (zona fuori mappa)</>}
      </p>

      {lista.length > 0 && (
        <>
          <div className="ledger-h" role="group" aria-label="Ordina per">
            <span>Persona</span>
            {colonne.map(([k, l]) => (
              <Link key={k} href={link({ ordine: k })} aria-current={ordine === k ? 'true' : undefined}>
                {l}
                {ordine === k ? (k === 'ida' ? ' ↓' : ' ↑') : ''}
              </Link>
            ))}
          </div>
          <div className="ledger">
            {lista.map((p, i) => {
              const ida = idaVisibile(p.ida, p.giudizi)
              const d = distanza(profilo.zona, p.zone)
              return (
                <Link key={p.id} href={`/professionisti/${p.id}`} className={p.disponibile ? 'lrow' : 'lrow off'} style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}>
                  <span className="lrow-b">
                    <span className="lrow-n">
                      {p.nome}
                      {p.disponibile && (
                        <>
                          <span className="wcard-av" aria-hidden="true" />
                          <span className="nascosto">, disponibile</span>
                        </>
                      )}
                    </span>
                    <span className="lrow-s">
                      {!p.disponibile && <span className="spento">non disponibile · </span>}
                      {p.competenze.slice(0, 2).join(' · ')}
                    </span>
                  </span>
                  <span className="lrow-ida">
                    <span className="nascosto">IDA </span>
                    {ida ?? <small>NUOVO</small>}
                  </span>
                  <span>
                    {p.su_preventivo ? (
                      <>
                        <span aria-hidden="true">prev.</span>
                        <span className="nascosto">su preventivo</span>
                      </>
                    ) : (
                      <>
                        {p.tariffa_oraria}
                        <span className="nascosto"> euro l’ora</span>
                      </>
                    )}
                  </span>
                  <span>
                    {d === 0 ? (
                      'qui'
                    ) : d >= 1000 ? (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="nascosto">distanza non disponibile</span>
                      </>
                    ) : (
                      <>
                        <span className="nascosto">circa </span>
                        {km(d)}
                        <span className="nascosto"> chilometri</span>
                      </>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </>
      )}
      {lista.length === 0 && (
        <div className="vuoto-grande">
          <b>Non è chi cerchi?</b>
          <p>Pubblica la richiesta in bacheca: rispondono le persone che lavorano qui vicino.</p>
          <Link href="/bacheca/nuova" className="bottone">
            Pubblica una richiesta
          </Link>
        </div>
      )}
    </>
  )
}

// Distanza tra i centri delle zone (Forlì è larga circa 7 km): solo una stima
function km(d: number): string {
  return d >= 1000 ? '—' : String(Math.max(0.5, Math.round(d * 0.07 * 2) / 2)).replace('.', ',')
}
