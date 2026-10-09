import Link from 'next/link'
import { Icona } from '@/components/Icona'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { richiediProfilo } from '@/lib/supabase/server'
import { ZONE } from '@/lib/validazione'

export const metadata = { title: 'Bacheca · TaskEase' }

export default async function Bacheca({ searchParams }: { searchParams: Promise<{ zona?: string }> }) {
  const { supabase, id, profilo } = await richiediProfilo()
  const { zona: zonaParam } = await searchParams
  const { data: scheda } = await supabase.from('professionisti').select('zone').eq('id', id).maybeSingle()
  const zona = (ZONE as readonly string[]).includes(zonaParam ?? '') ? zonaParam! : zonaParam === 'tutte' ? '' : null
  // Senza filtro: le tue zone (se lavori) o la tua zona
  const zone = zona === null ? (scheda?.zone ?? [profilo.zona]) : zona ? [zona] : [...ZONE]

  const [{ data: post }, { data: miei }] = await Promise.all([
    supabase
      .from('bacheca')
      .select('id, titolo, dettagli, zona, competenza, risposte, creato_il, autore, profili!bacheca_autore_fkey(nome)')
      .eq('stato', 'aperta')
      .gt('scade_il', new Date().toISOString())
      .in('zona', zone)
      .neq('autore', id)
      .order('creato_il', { ascending: false })
      .limit(100),
    supabase.from('bacheca').select('id, titolo, stato, risposte, creato_il').eq('autore', id).order('creato_il', { ascending: false }).limit(20),
  ])

  return (
    <>
      <Testata titolo="Bacheca" sotto="Richieste di chi abita in zona" />
      <Link href="/bacheca/nuova" className="home-cta">
        <Icona nome="plus" lato={20} />
        <span>Pubblica una richiesta</span>
        <Icona nome="arrowR" lato={18} />
      </Link>

      {(miei ?? []).length > 0 && (
        <section aria-label="Le tue richieste">
          <div className="sec-h">
            <h2>Le tue richieste</h2>
          </div>
          {(miei ?? []).map((p) => (
            <Link key={p.id} href={`/bacheca/${p.id}`} className="post mine">
              <span className="post-k">{p.stato === 'aperta' ? 'Aperta' : p.stato === 'chiusa' ? 'Chiusa' : 'Rimossa dalla moderazione'}</span>
              <span className="post-t">{quandoFa(p.creato_il)}</span>
              <span className="post-x">{p.titolo}</span>
              <span className="post-a">
                <span className="n">
                  {p.risposte} {p.risposte === 1 ? 'risposta' : 'risposte'}
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}

      <div className="sec-h">
        <h2>In zona</h2>
      </div>
      <nav className="cats" aria-label="Zona">
        <Link href="/bacheca" className="cat2 zona" aria-current={zona === null ? 'true' : undefined}>
          {scheda ? 'Le mie zone' : 'La mia zona'}
        </Link>
        <Link href="/bacheca?zona=tutte" className="cat2 zona" aria-current={zona === '' ? 'true' : undefined}>
          Tutte
        </Link>
        {ZONE.map((z) => (
          <Link key={z} href={`/bacheca?zona=${encodeURIComponent(z)}`} className="cat2 zona" aria-current={zona === z ? 'true' : undefined}>
            {z}
          </Link>
        ))}
      </nav>

      <section aria-label="Richieste aperte" className="post-lista">
        {(post ?? []).length === 0 && <p className="vuoto">Nessuna richiesta aperta qui.</p>}
        {(post ?? []).map((p, i) => (
          <Link key={p.id} href={`/bacheca/${p.id}`} className="post" style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}>
            <span className="post-k">{p.competenza ?? 'Richiesta'}</span>
            <span className="post-t">{quandoFa(p.creato_il)}</span>
            <span className="post-x">{p.titolo}</span>
            {p.dettagli && <span className="post-d taglia">{p.dettagli}</span>}
            <span className="post-by">
              {p.profili?.nome.split(' ')[0]} · {p.zona}
            </span>
            <span className="post-a">
              <span className="rispondi">Rispondi</span>
              <span className="n">
                {p.risposte} {p.risposte === 1 ? 'risposta' : 'risposte'}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </>
  )
}
