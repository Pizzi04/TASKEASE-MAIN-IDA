import { createBrowserClient } from '@supabase/ssr'
import { configSupabase } from './config'

export function supabaseBrowser() {
  const { url, chiave } = configSupabase()
  return createBrowserClient(url, chiave)
}
