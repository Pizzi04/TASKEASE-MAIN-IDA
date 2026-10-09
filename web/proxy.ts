import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { configSupabase } from './lib/supabase/config'

// Regole su cosa può caricare la pagina (CSP). Gli script devono avere il nonce di questa richiesta:
// uno script iniettato (es. da un testo maligno) non parte. Next mette il nonce da solo ai suoi script.
function regoleContenuti(nonce: string, supabase: string): string {
  const db = new URL(supabase)
  const ws = `${db.protocol === 'https:' ? 'wss' : 'ws'}://${db.host}`
  const sviluppo = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${sviluppo ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${db.origin}`,
    "font-src 'self'",
    `connect-src 'self' ${db.origin} ${ws} https://challenges.cloudflare.com`,
    'frame-src https://challenges.cloudflare.com',
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(sviluppo ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

// Rinfresca la sessione Supabase a ogni navigazione e riscrive i cookie aggiornati.
export async function proxy(request: NextRequest) {
  const { url, chiave } = configSupabase()
  const nonce = btoa(crypto.randomUUID())
  const csp = regoleContenuti(nonce, url)
  // La pagina richiesta arriva alle pagine server: se serve l'accesso, dopo si torna qui
  const conPercorso = () => {
    const h = new Headers(request.headers)
    h.set('x-percorso', request.nextUrl.pathname + request.nextUrl.search)
    h.set('x-nonce', nonce)
    h.set('Content-Security-Policy', csp)
    const r = NextResponse.next({ request: { headers: h } })
    r.headers.set('Content-Security-Policy', csp)
    return r
  }
  let risposta = conPercorso()

  const supabase = createServerClient(url, chiave, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(daImpostare, intestazioni) {
        for (const { name, value } of daImpostare) request.cookies.set(name, value)
        risposta = conPercorso()
        for (const { name, value, options } of daImpostare) risposta.cookies.set(name, value, options)
        for (const [k, v] of Object.entries(intestazioni ?? {})) risposta.headers.set(k, v)
      },
    },
  })

  await supabase.auth.getClaims()
  return risposta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|api/push|api/manutenzione|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
