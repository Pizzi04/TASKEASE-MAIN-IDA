'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BottoneInvio, Esito, ProviderInvio, useAzione } from '@/components/Modulo'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { inviaMessaggio } from '../../azioni'

type Messaggio = { id: number; autore: string; testo: string; creato_il: string; letto_il: string | null }

export default function Chat({
  prenotazione,
  io,
  iniziali,
  chiusa,
}: {
  prenotazione: number
  io: string
  iniziali: Messaggio[]
  chiusa: boolean
}) {
  const [messaggi, setMessaggi] = useState(iniziali)
  const [testo, setTesto] = useState('')
  const { stato, onSubmit, inCorso } = useAzione(inviaMessaggio)
  const fondo = useRef<HTMLDivElement>(null)

  // Nuovi messaggi in tempo reale (le regole del database fanno arrivare solo quelli di questa chat)
  useEffect(() => {
    const supabase = supabaseBrowser()
    const canale = supabase
      .channel('chat-' + prenotazione)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messaggi', filter: `prenotazione=eq.${prenotazione}` },
        (evento) => {
          const m = evento.new as Messaggio
          if (!m?.id) return
          setMessaggi((prima) => (prima.some((x) => x.id === m.id) ? prima.map((x) => (x.id === m.id ? m : x)) : [...prima, m]))
          if (evento.eventType === 'INSERT' && m.autore !== io) supabase.rpc('segna_letti', { p_prenotazione: prenotazione })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(canale)
    }
  }, [prenotazione, io])

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: 'end' })
  }, [messaggi.length])

  // Messaggio inviato: si svuota la casella e si rilegge la chat (se il tempo reale non arriva, il messaggio compare lo stesso)
  useEffect(() => {
    if (!stato || stato.errore) return
    setTesto('')
    supabaseBrowser()
      .from('messaggi')
      .select('id, autore, testo, creato_il, letto_il')
      .eq('prenotazione', prenotazione)
      .order('creato_il')
      .limit(500)
      .then(({ data }) => data && setMessaggi(data))
  }, [stato, prenotazione])

  return (
    <>
      <div className="chat" aria-live="polite">
        {messaggi.length === 0 && <p className="vuoto">Nessun messaggio. Scrivi tu per primo.</p>}
        {messaggi.map((m) => (
          <div key={m.id} className={m.autore === io ? 'msg mio' : 'msg'}>
            <p>{m.testo}</p>
            <span className="ora">
              {new Date(m.creato_il).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              {m.autore === io && m.letto_il ? ' · letto' : ''}
            </span>
            {m.autore !== io && (
              <Link className="piccolo-link" href={`/segnala?tipo=contenuto&oggetto=messaggio&id=${m.id}&chi=${m.autore}`}>
                Segnala
              </Link>
            )}
          </div>
        ))}
        <div ref={fondo} />
      </div>
      {chiusa ? (
        <p className="avviso">La prenotazione è chiusa: non si può più scrivere.</p>
      ) : (
        <ProviderInvio inCorso={inCorso}>
          <form className="scrivi" onSubmit={onSubmit}>
            <input type="hidden" name="prenotazione" value={prenotazione} />
            <label htmlFor="testo" className="nascosto">
              Messaggio
            </label>
            <textarea id="testo" name="testo" rows={2} maxLength={1000} value={testo} onChange={(e) => setTesto(e.target.value)} placeholder="Scrivi un messaggio" />
            <BottoneInvio testo="Invia" inCorso="…" tipo="piccolo" />
          </form>
          {stato?.errore && <Esito stato={stato} />}
        </ProviderInvio>
      )}
    </>
  )
}
