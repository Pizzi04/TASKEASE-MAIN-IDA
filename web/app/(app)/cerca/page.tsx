import Link from 'next/link'
import { COLONNE_PRO, RigaProfessionista, daRiga } from '@/components/RigaProfessionista'
import { Testata } from '@/components/Testata'
import { registra } from '@/lib/eventi'
import { richiediProfilo } from '@/lib/supabase/server'
import { COMPETENZE, ZONE } from '@/lib/validazione'
import { ordina, type Ordine } from '@/lib/zone'

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
  if (q && !competenza) {
    const parola = q.toLowerCase()
    lista = lista.filter(
      (p) =>
        p.nome.toLowerCase().includes(parola) ||
        p.competenze.some((c) => c.toLowerCase().includes(parola) || c === daQ),
    )
  }
  lista = ordina(lista, profilo.zona, ordine)

  const link = (cambia: Record<string, string>) => {
    const p = new URLSearchParams({ q, competenza, zona, ordine, tutti: ancheNonDisponibili ? '1' : '', ...cambia })
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k)
    return `/cerca?${p}`
  }

  return (
    <>
      <Testata titolo="Cerca" indietro="/" />
      <form className="filtri" role="search">
        <label htmlFor="q" className="nascosto">
          Cosa ti serve
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Cosa ti serve?" />
        <div className="filtri-riga">
          <label>
            <span className="nascosto">Categoria</span>
            <select name="competenza" defaultValue={competenza}>
              <option value="">Tutte le categorie</option>
              {COMPETENZE.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="nascosto">Zona</span>
            <select name="zona" defaultValue={zona}>
              <option value="">Tutte le zone</option>
              {ZONE.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
        </div>
        <input type="hidden" name="ordine" value={ordine} />
        <button className="bottone piccolo" type="submit">
          Cerca
        </button>
      </form>

      <div className="chips" aria-label="Ordina">
        {(
          [
            ['vicini', 'Più vicini'],
            ['prezzo', 'Prezzo'],
            ['ida', 'IDA più alto'],
          ] as const
        ).map(([k, l]) => (
          <Link key={k} href={link({ ordine: k })} className="chip" aria-current={ordine === k ? 'true' : undefined}>
            {l}
          </Link>
        ))}
        <Link href={link({ tutti: ancheNonDisponibili ? '' : '1' })} className="chip" aria-current={ancheNonDisponibili ? 'true' : undefined}>
          Anche non disponibili
        </Link>
      </div>

      {daQ && !competenza && (
        <p className="nota">
          Forse cerchi <Link href={link({ competenza: daQ, q: '' })}>{daQ}</Link>?
        </p>
      )}

      <p className="nota" aria-live="polite">
        {lista.length === 0 ? 'Nessun risultato.' : `${lista.length} ${lista.length === 1 ? 'persona' : 'persone'}`} ·{' '}
        <Link href="/legale/ranking">Come ordiniamo i risultati</Link>
      </p>
      {lista.map((p) => (
        <RigaProfessionista key={p.id} p={p} />
      ))}
      {lista.length === 0 && (
        <div className="scheda">
          <p>Non trovi chi ti serve? Pubblica la richiesta in bacheca: chi lavora in zona ti risponde.</p>
          <Link href="/bacheca/nuova" className="bottone">
            Pubblica in bacheca
          </Link>
        </div>
      )}
    </>
  )
}
