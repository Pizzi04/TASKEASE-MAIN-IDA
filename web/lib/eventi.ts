import type { Db } from './supabase/server'

export type Evento =
  | 'apertura'
  | 'accesso_avviato'
  | 'accesso_riuscito'
  | 'profilo_creato'
  | 'ricerca'
  | 'scheda_vista'
  | 'prenotazione_avviata'
  | 'prenotazione_inviata'
  | 'post_pubblicato'
  | 'proposta_inviata'
  | 'professionista_creato'
  | 'app_installata'

// Conta un evento senza dati personali (solo nome e giorno). Un errore qui non deve mai bloccare l'utente.
export async function registra(supabase: Db, nome: Evento) {
  try {
    await supabase.rpc('registra_evento', { p_nome: nome })
  } catch {
    // niente
  }
}
