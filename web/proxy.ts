import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { configSupabase } from './lib/supabase/config'

// Rinfresca la sessione Supabase a ogni navigazione e riscrive i cookie aggiornati.
export async function proxy(request: NextRequest) {
  const { url, chiave } = configSupabase()
  let risposta = NextResponse.next({ request })

  const supabase = createServerClient(url, chiave, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(daImpostare, intestazioni) {
        for (const { name, value } of daImpostare) request.cookies.set(name, value)
        risposta = NextResponse.next({ request })
        for (const { name, value, options } of daImpostare) risposta.cookies.set(name, value, options)
        for (const [k, v] of Object.entries(intestazioni ?? {})) risposta.headers.set(k, v)
      },
    },
  })

  await supabase.auth.getClaims()
  return risposta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|api/push|api/manutenzione|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
