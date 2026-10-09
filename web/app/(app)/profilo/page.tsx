import Link from 'next/link'
import { BottoneEsci, InstallaApp, NotifichePush } from '@/components/AppInstallabile'
import { Avatar } from '@/components/Avatar'
import { Icona } from '@/components/Icona'
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
      <section className="profilo-testa">
        <Avatar nome={profilo.nome} foto={profilo.foto} lato={64} />
        <div>
          <b>{profilo.nome}</b>
          <p className="nota">
            {profilo.zona}
            {telefono ? ` · ${mostraTelefono(telefono)}` : ''}
          </p>
          <p className="nota">Su TaskEase da {new Date(profilo.creato_il).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
        </div>
      </section>

      <nav className="acc-list" aria-label="Le tue cose">
        <Voce href="/prenotazioni" ic="cal" t="Prenotazioni" s="In corso e storico" />
        <Voce href="/notifiche" ic="bell" t="Notifiche" s="Conferme, messaggi, giudizi" />
        <Voce href="/profilo/preferiti" ic="heart" t="Preferiti" s="Chi ti è piaciuto, da richiamare" />
        <Voce href="/passaporto" ic="pin" t="Passaporto di quartiere" s="Un timbro per ogni lavoro" />
      </nav>

      <p className="acc-sec">Account</p>
      <nav className="acc-list" aria-label="Il tuo account">
        <Voce href="/profilo/modifica" ic="user" t="Nome, zona e foto" />
        <Voce href="/profilo/telefono" ic="phone" t="Numero di telefono" s={telefono ? mostraTelefono(telefono) : undefined} />
        <Voce href="/segnalazioni" ic="flag" t="Le mie segnalazioni" />
        <Voce href="/profilo/bloccati" ic="x" t="Persone bloccate" />
        <a href="/profilo/dati" download className="acc-row">
          <Icona nome="book" lato={20} />
          <span className="acc-t">
            Scarica i miei dati<small>Un file con tutto quello che sappiamo di te</small>
          </span>
        </a>
        {admin && <Voce href="/admin" ic="shield" t="Pannello di amministrazione" />}
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

      <p className="acc-sec">Aiuto e documenti</p>
      <nav className="acc-list" aria-label="Aiuto e documenti">
        <Voce href="/assistenza" ic="book" t="Come funziona e assistenza" />
        <Voce href="/legale/termini" ic="book" t="Termini d’uso" />
        <Voce href="/legale/privacy" ic="shield" t="Informativa privacy" />
        <Voce href="/legale/giudizi" ic="seal" t="Come verifichiamo i giudizi" />
        <Voce href="/legale/ranking" ic="search" t="Come ordiniamo i risultati" />
        <Voce href="/legale/info" ic="book" t="Informazioni legali" />
      </nav>

      <BottoneEsci />
      <Link href="/profilo/elimina" className="secondario pericolo-testo">
        Elimina l’account
      </Link>
    </>
  )
}

function Voce({ href, ic, t, s }: { href: string; ic: string; t: string; s?: string }) {
  return (
    <Link href={href} className="acc-row">
      <Icona nome={ic} lato={20} />
      <span className="acc-t">
        {t}
        {s && <small>{s}</small>}
      </span>
    </Link>
  )
}
