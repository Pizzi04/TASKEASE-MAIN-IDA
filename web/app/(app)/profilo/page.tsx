import Link from 'next/link'
import { BottoneEsci, InstallaApp, NotifichePush } from '@/components/AppInstallabile'
import { Avatar } from '@/components/Avatar'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { mostraTelefono } from '@/lib/validazione'
import { cambiaPausa } from './azioni'

export const metadata = { title: 'Profilo · TaskEase' }

export default async function Profilo() {
  const { supabase, profilo, telefono } = await richiediProfilo()
  const { data: admin } = await supabase.rpc('e_admin')

  return (
    <>
      <Testata titolo="Profilo" />
      <section className="scheda pro-testa">
        <Avatar nome={profilo.nome} foto={profilo.foto} lato={64} />
        <div>
          <b>{profilo.nome}</b>
          <p className="nota">
            {profilo.zona} · {telefono ? mostraTelefono(telefono) : ''}
          </p>
          <p className="nota">Su TaskEase da {new Date(profilo.creato_il).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
        </div>
      </section>

      <nav className="menu" aria-label="Il tuo account">
        <Link href="/profilo/modifica">Modifica nome, zona e foto</Link>
        <Link href="/profilo/preferiti">Preferiti</Link>
        <Link href="/passaporto">Il mio passaporto di quartiere</Link>
        <Link href="/notifiche">Notifiche</Link>
        <Link href="/segnalazioni">Le mie segnalazioni</Link>
        <Link href="/profilo/bloccati">Persone bloccate</Link>
        <a href="/profilo/dati" download>
          Scarica i miei dati
        </a>
        {admin && <Link href="/admin">Pannello di amministrazione</Link>}
      </nav>

      <form action={cambiaPausa} className="scheda interruttore">
        <input type="hidden" name="pausa" value={profilo.in_pausa ? 'no' : 'si'} />
        <div>
          <b>{profilo.in_pausa ? 'Profilo in pausa' : 'Profilo attivo'}</b>
          <p className="nota">In pausa non compari nelle ricerche. I tuoi dati restano.</p>
        </div>
        <button type="submit" className="secondario" role="switch" aria-checked={!profilo.in_pausa}>
          {profilo.in_pausa ? 'Riattiva' : 'Metti in pausa'}
        </button>
      </form>

      <NotifichePush />
      <InstallaApp />

      <nav className="menu" aria-label="Aiuto e documenti">
        <Link href="/assistenza">Come funziona e assistenza</Link>
        <Link href="/legale/termini">Termini d’uso</Link>
        <Link href="/legale/privacy">Informativa privacy</Link>
        <Link href="/legale/giudizi">Come verifichiamo i giudizi</Link>
        <Link href="/legale/ranking">Come ordiniamo i risultati</Link>
        <Link href="/legale/info">Informazioni legali</Link>
      </nav>

      <BottoneEsci />
      <Link href="/profilo/elimina" className="secondario pericolo-testo">
        Elimina l’account
      </Link>
    </>
  )
}
