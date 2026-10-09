import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import { linkInterno } from '@/lib/link'
import { supabaseAmministrazione } from '@/lib/supabase/server'

// Chiamata da Supabase (Database Webhook su INSERT in "notifiche"): manda la notifica ai telefoni dell'utente.
type Corpo = { type?: string; table?: string; record?: { utente?: string; testo?: string; link?: string } }

function segretoGiusto(ricevuto: string | null): boolean {
  const atteso = process.env.PUSH_WEBHOOK_SECRET
  if (!atteso || !ricevuto) return false
  const a = Buffer.from(ricevuto)
  const b = Buffer.from(atteso)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!segretoGiusto(request.headers.get('x-webhook-secret'))) return NextResponse.json({ errore: 'non autorizzato' }, { status: 401 })
  const pubblica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privata = process.env.VAPID_PRIVATE_KEY
  const admin = supabaseAmministrazione()
  if (!pubblica || !privata || !admin) return NextResponse.json({ errore: 'push non configurate' }, { status: 503 })

  const corpo = (await request.json().catch(() => ({}))) as Corpo
  const r = corpo.record
  if (corpo.type !== 'INSERT' || corpo.table !== 'notifiche' || !r?.utente || !r.testo) return NextResponse.json({ ok: true, inviate: 0 })

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:assistenza@example.com', pubblica, privata)
  const { data: iscrizioni } = await admin.from('push_iscrizioni').select('id, endpoint, p256dh, auth').eq('utente', r.utente)
  const messaggio = JSON.stringify({ titolo: 'TaskEase', testo: r.testo, link: linkInterno(r.link, '/notifiche') })

  let inviate = 0
  const scadute: number[] = []
  await Promise.all(
    (iscrizioni ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, messaggio, { TTL: 60 * 60 * 24 })
        inviate++
      } catch (e) {
        const codice = (e as { statusCode?: number }).statusCode
        if (codice === 404 || codice === 410) scadute.push(s.id) // il telefono ha revocato l'iscrizione
      }
    }),
  )
  if (scadute.length) await admin.from('push_iscrizioni').delete().in('id', scadute)
  return NextResponse.json({ ok: true, inviate })
}
