import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { configSupabase } from './config'

// Client per pagine server e azioni server. La sessione arriva dai cookie,
// già rinfrescati da proxy.ts.
export async function supabaseServer() {
  const { url, chiave } = configSupabase()
  const cookieStore = await cookies()
  return createServerClient(url, chiave, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(daImpostare) {
        try {
          for (const { name, value, options } of daImpostare) cookieStore.set(name, value, options)
        } catch {
          // Nelle pagine server i cookie non si possono scrivere: ci pensa proxy.ts.
        }
      },
    },
  })
}

// Utente verificato (firma del token controllata) oppure null.
export async function utenteCorrente() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims?.sub
  return id ? { supabase, id, telefono: (data.claims.phone as string | undefined) ?? '' } : { supabase, id: null, telefono: '' }
}
