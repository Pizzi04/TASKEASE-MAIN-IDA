import Link from 'next/link'
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
      <Link href="/bacheca/nuova" className="bottone">
        Pubblica una richiesta
      </Link>

      {(miei ?? []).length > 0 && (
        <section aria-label="Le tue richieste">
          <h2>Le tue richieste</h2>
          {(miei ?? []).map((p) => (
            <Link key={p.id} href={`/bacheca/${p.id}`} className="scheda link-scheda">
              <b>{p.titolo}</b>
              <span className={p.stato === 'aperta' ? 'stato ok' : 'stato'}>
                {p.stato === 'aperta' ? 'Aperta' : p.stato === 'chiusa' ? 'Chiusa' : 'Rimossa dalla moderazione'} · {p.risposte}{' '}
                {p.risposte === 1 ? 'risposta' : 'risposte'}
              </span>
            </Link>
          ))}
        </section>
      )}

      <nav className="chips" aria-label="Zona">
        <Link href="/bacheca" className="chip" aria-current={zona === null ? 'true' : undefined}>
          {scheda ? 'Le mie zone' : 'La mia zona'}
        </Link>
        <Link href="/bacheca?zona=tutte" className="chip" aria-current={zona === '' ? 'true' : undefined}>
          Tutte
        </Link>
        {ZONE.map((z) => (
          <Link key={z} href={`/bacheca?zona=${encodeURIComponent(z)}`} className="chip" aria-current={zona === z ? 'true' : undefined}>
            {z}
          </Link>
        ))}
      </nav>

      <section aria-label="Richieste aperte">
        {(post ?? []).length === 0 && <p className="vuoto">Nessuna richiesta aperta qui.</p>}
        {(post ?? []).map((p) => (
          <Link key={p.id} href={`/bacheca/${p.id}`} className="scheda link-scheda">
            <b>{p.titolo}</b>
            {p.dettagli && <span className="taglia">{p.dettagli}</span>}
            <span className="stato">
              {p.profili?.nome.split(' ')[0]} · {p.zona} · {quandoFa(p.creato_il)}
              {p.competenza ? ` · ${p.competenza}` : ''} · {p.risposte} {p.risposte === 1 ? 'risposta' : 'risposte'}
            </span>
          </Link>
        ))}
      </section>
    </>
  )
}
