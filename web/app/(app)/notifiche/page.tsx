import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { NotifichePush } from '@/components/AppInstallabile'
import { Testata } from '@/components/Testata'
import { quandoFa } from '@/lib/date'
import { richiediProfilo } from '@/lib/supabase/server'

export const metadata = { title: 'Notifiche · TaskEase' }

async function segnaTutteLette() {
  'use server'
  const { supabase, id } = await richiediProfilo()
  await supabase.from('notifiche').update({ letta: true }).eq('utente', id).eq('letta', false)
  revalidatePath('/', 'layout')
}

export default async function Notifiche() {
  const { supabase, id } = await richiediProfilo()
  const { data } = await supabase
    .from('notifiche')
    .select('id, tipo, testo, link, letta, creato_il')
    .eq('utente', id)
    .order('creato_il', { ascending: false })
    .limit(100)
  const nonLette = (data ?? []).filter((n) => !n.letta).length

  return (
    <>
      <Testata titolo="Notifiche" indietro="/" />
      <NotifichePush />
      {nonLette > 0 && (
        <form action={segnaTutteLette}>
          <button className="secondario" type="submit">
            Segna tutte come lette
          </button>
        </form>
      )}
      {(data ?? []).length === 0 && <p className="vuoto">Nessuna notifica. Ti avvisiamo qui di prenotazioni, messaggi e giudizi.</p>}
      <ul className="lista-notifiche">
        {(data ?? []).map((n) => (
          <li key={n.id} className={n.letta ? '' : 'nuova'}>
            <Link href={n.link.startsWith('/') ? n.link : '/'}>
              <span>{n.testo}</span>
              <small>
                {quandoFa(n.creato_il)}
                {!n.letta && ' · nuova'}
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
