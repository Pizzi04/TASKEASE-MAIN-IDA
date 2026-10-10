import { NextResponse } from 'next/server'
import { utenteCorrente } from '@/lib/supabase/server'

// Portabilità (GDPR art. 20): tutti i tuoi dati in un file JSON
export async function GET() {
  const { supabase, id, telefono } = await utenteCorrente()
  if (!id) return NextResponse.json({ errore: 'accesso richiesto' }, { status: 401 })

  const leggi = async <T,>(p: PromiseLike<{ data: T | null }>) => (await p).data
  const dati = {
    scaricato_il: new Date().toISOString(),
    telefono,
    profilo: await leggi(supabase.from('profili').select('id, nome, zona, ruolo, foto, in_pausa, creato_il, aggiornato_il').eq('id', id).maybeSingle()),
    consensi: await leggi(supabase.from('consensi').select('documento, versione, accettato_il').eq('utente', id)),
    scheda_professionista: await leggi(supabase.from('professionisti').select('id, tipo, competenze, zone, tariffa_oraria, su_preventivo, bio, disponibile, partita_iva, abilitazione_impianti, assicurazione_rc, verificato, ida, lavori, giudizi, creato_il, aggiornato_il').eq('id', id).maybeSingle()),
    dati_fiscali: await leggi(supabase.from('dati_fiscali').select('codice_fiscale, data_nascita, residenza, dichiarazione_fiscale, creato_il, aggiornato_il').eq('id', id).maybeSingle()),
    verifiche: await leggi(supabase.from('verifiche').select('preferenza, disponibilita, stato, motivazione, creato_il, deciso_il').eq('professionista', id)),
    prenotazioni: await leggi(supabase.from('prenotazioni').select('id, cliente, professionista, competenza, descrizione, zona, indirizzo, giorno, ora, ore, tariffa_oraria, stato, motivo, controproposta, post, creato_il, aggiornato_il').or(`cliente.eq.${id},professionista.eq.${id}`)),
    indirizzi: await leggi(supabase.from('indirizzi').select('prenotazione, indirizzo').eq('cliente', id)),
    giudizi_lasciati: await leggi(supabase.from('giudizi').select('prenotazione, cliente, professionista, puntualita, qualita, parola, pulizia, comunicazione, punteggio, commento, nascosto, risposta, risposta_il, creato_il').eq('cliente', id)),
    giudizi_ricevuti: await leggi(supabase.from('giudizi').select('prenotazione, cliente, professionista, puntualita, qualita, parola, pulizia, comunicazione, punteggio, commento, nascosto, risposta, risposta_il, creato_il').eq('professionista', id)),
    messaggi_scritti: await leggi(supabase.from('messaggi').select('prenotazione, testo, creato_il').eq('autore', id)),
    bacheca: await leggi(supabase.from('bacheca').select('id, titolo, dettagli, competenza, zona, foto, stato, risposte, scade_il, creato_il').eq('autore', id)),
    proposte: await leggi(supabase.from('proposte').select('id, post, messaggio, creato_il').eq('professionista', id)),
    preferiti: await leggi(supabase.from('preferiti').select('professionista, creato_il').eq('utente', id)),
    blocchi: await leggi(supabase.from('blocchi').select('bloccato, creato_il').eq('utente', id)),
    segnalazioni: await leggi(supabase.from('segnalazioni').select('id, tipo, oggetto_tipo, oggetto_id, motivo, testo, stato, azione, motivazione, creato_il, deciso_il').eq('autore', id)),
    notifiche: await leggi(supabase.from('notifiche').select('tipo, testo, creato_il, letta').eq('utente', id)),
  }
  return new NextResponse(JSON.stringify(dati, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="taskease-i-miei-dati.json"',
      'cache-control': 'no-store',
    },
  })
}
