import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { configSupabase } from './config'
import type { Database } from './tipi'

// Client per pagine server e azioni server. La sessione arriva dai cookie,
// già rinfrescati da proxy.ts.
export async function supabaseServer() {
  const { url, chiave } = configSupabase()
  const cookieStore = await cookies()
  return createServerClient<Database>(url, chiave, {
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

export type Db = Awaited<ReturnType<typeof supabaseServer>>

// Utente verificato (firma del token controllata) oppure id null.
// cache: nella stessa richiesta layout e pagina leggono l'utente una volta sola
export const utenteCorrente = cache(async () => {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims?.sub ?? null
  const telefono = (data?.claims?.phone as string | undefined) ?? ''
  return { supabase, id, telefono }
})

// Per le pagine dell'app: serve l'accesso e un profilo, altrimenti si va dove manca.
export const richiediProfilo = cache(async () => {
  const { supabase, id, telefono } = await utenteCorrente()
  if (!id) redirect('/accedi')
  const { data: profilo, error } = await supabase
    .from('profili')
    .select('id, nome, zona, ruolo, in_pausa, sospeso, foto, creato_il')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Non riesco a leggere il profilo')
  if (!profilo) redirect('/profilo/nuovo')
  return { supabase, id, telefono, profilo }
})

export async function richiediAdmin() {
  const sessione = await richiediProfilo()
  const { data: admin } = await sessione.supabase.rpc('e_admin')
  if (!admin) redirect('/')
  return sessione
}

// Client con la chiave segreta: SOLO sul server, solo per operazioni che l'utente non può fare da sé
// (eliminare il proprio account). Restituisce null se la chiave non è configurata.
export function supabaseAmministrazione() {
  const { url } = configSupabase()
  const segreta = process.env.SUPABASE_SECRET_KEY
  if (!segreta) return null
  return createClient<Database>(url, segreta, { auth: { persistSession: false, autoRefreshToken: false } })
}
