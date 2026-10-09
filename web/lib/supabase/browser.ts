import { createBrowserClient } from '@supabase/ssr'
import { configSupabase } from './config'
import type { Database } from './tipi'

export function supabaseBrowser() {
  const { url, chiave } = configSupabase()
  return createBrowserClient<Database>(url, chiave)
}
