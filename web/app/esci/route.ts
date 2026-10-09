import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Solo dal nostro sito: un altro sito non può far uscire l'utente (CSRF)
function stessoSito(request: NextRequest): boolean {
  const origine = request.headers.get('origin')
  if (origine) return origine === request.nextUrl.origin
  const sito = request.headers.get('sec-fetch-site')
  return sito === null || sito === 'same-origin'
}

export async function POST(request: NextRequest) {
  if (!stessoSito(request)) return NextResponse.json({ errore: 'richiesta non valida' }, { status: 403 })
  const supabase = await supabaseServer()
  // Solo questo dispositivo: uscire dal telefono non deve chiudere la sessione sul computer
  await supabase.auth.signOut({ scope: 'local' })
  return NextResponse.redirect(new URL('/accedi', request.url), { status: 303 })
}
