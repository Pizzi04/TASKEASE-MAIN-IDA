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
    profilo: await leggi(supabase.from('profili').select('*').eq('id', id).maybeSingle()),
    consensi: await leggi(supabase.from('consensi').select('documento, versione, accettato_il').eq('utente', id)),
    scheda_professionista: await leggi(supabase.from('professionisti').select('*').eq('id', id).maybeSingle()),
    dati_fiscali: await leggi(supabase.from('dati_fiscali').select('*').eq('id', id).maybeSingle()),
    verifiche: await leggi(supabase.from('verifiche').select('preferenza, disponibilita, stato, motivazione, creato_il, deciso_il').eq('professionista', id)),
    prenotazioni: await leggi(supabase.from('prenotazioni').select('*').or(`cliente.eq.${id},professionista.eq.${id}`)),
    indirizzi: await leggi(supabase.from('indirizzi').select('prenotazione, indirizzo').eq('cliente', id)),
    giudizi_lasciati: await leggi(supabase.from('giudizi').select('*').eq('cliente', id)),
    giudizi_ricevuti: await leggi(supabase.from('giudizi').select('*').eq('professionista', id)),
    messaggi_scritti: await leggi(supabase.from('messaggi').select('prenotazione, testo, creato_il').eq('autore', id)),
    bacheca: await leggi(supabase.from('bacheca').select('*').eq('autore', id)),
    proposte: await leggi(supabase.from('proposte').select('*').eq('professionista', id)),
    preferiti: await leggi(supabase.from('preferiti').select('professionista, creato_il').eq('utente', id)),
    blocchi: await leggi(supabase.from('blocchi').select('bloccato, creato_il').eq('utente', id)),
    segnalazioni: await leggi(supabase.from('segnalazioni').select('*').eq('autore', id)),
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
