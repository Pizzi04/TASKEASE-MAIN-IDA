import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAmministrazione } from '@/lib/supabase/server'

// Manutenzione notturna (Vercel Cron, vercel.json): applica i tempi di conservazione dell'informativa privacy.
// - messaggi: 12 mesi dopo la chiusura della prenotazione
// - segnalazioni decise: 12 mesi dopo la decisione
// - notifiche: lette dopo 90 giorni, tutte dopo 12 mesi
// - foto di richieste rimosse o scadute: subito
// - archivio fiscale: alla data di fine conservazione
// - account inattivi: avviso a 23 mesi, cancellazione a 24 mesi
export const maxDuration = 60

function autorizzato(intestazione: string | null): boolean {
  const segreto = process.env.CRON_SECRET
  if (!segreto || !intestazione) return false
  const a = Buffer.from(intestazione)
  const b = Buffer.from(`Bearer ${segreto}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

const fa = (giorni: number) => new Date(Date.now() - giorni * 86400000).toISOString()

export async function GET(request: NextRequest) {
  if (!autorizzato(request.headers.get('authorization'))) return NextResponse.json({ errore: 'non autorizzato' }, { status: 401 })
  const db = supabaseAmministrazione()
  if (!db) return NextResponse.json({ errore: 'manca SUPABASE_SECRET_KEY' }, { status: 503 })
  const fatto: Record<string, number | string> = {}

  // Messaggi di prenotazioni chiuse da più di 12 mesi (tutti, in un colpo solo nel database)
  const { data: messaggi } = await db.rpc('pulisci_messaggi_vecchi')
  fatto.messaggi = messaggi ?? 0

  fatto.segnalazioni = (await db.from('segnalazioni').delete({ count: 'exact' }).neq('stato', 'aperta').lt('deciso_il', fa(365))).count ?? 0
  fatto.notifiche_lette = (await db.from('notifiche').delete({ count: 'exact' }).eq('letta', true).lt('creato_il', fa(90))).count ?? 0
  fatto.notifiche_vecchie = (await db.from('notifiche').delete({ count: 'exact' }).lt('creato_il', fa(365))).count ?? 0
  fatto.archivio_fiscale =
    (await db.from('archivio_fiscale').delete({ count: 'exact' }).lt('conservare_fino_al', new Date().toISOString().slice(0, 10))).count ?? 0

  // Foto di richieste rimosse dalla moderazione o scadute
  const { data: conFoto } = await db
    .from('bacheca')
    .select('id, foto')
    .not('foto', 'is', null)
    .or(`stato.eq.rimossa,scade_il.lt.${new Date().toISOString()}`)
    .limit(500)
  if (conFoto?.length) {
    await db.storage.from('foto').remove(conFoto.map((p) => p.foto!))
    await db.from('bacheca').update({ foto: null }).in('id', conFoto.map((p) => p.id))
    fatto.foto_bacheca = conFoto.length
  }

  // Account inattivi: avviso a 23 mesi, cancellazione a 24
  let avvisati = 0
  let cancellati = 0
  const limite23 = Date.now() - 700 * 86400000
  const limite24 = Date.now() - 730 * 86400000
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: 200 })
    if (error || !data.users.length) break
    // La sessione si rinnova da sola: l'ultimo accesso vero lo segna l'app in profili.ultimo_accesso
    const { data: accessi } = await db
      .from('profili')
      .select('id, ultimo_accesso')
      .in('id', data.users.map((u) => u.id))
    const usato = new Map((accessi ?? []).map((p) => [p.id, p.ultimo_accesso]))
    for (const u of data.users) {
      const ultimo = Math.max(
        ...[u.last_sign_in_at, u.created_at, usato.get(u.id)].filter((d): d is string => !!d).map((d) => new Date(d).getTime()),
      )
      if (ultimo < limite24) {
        await db.rpc('prepara_eliminazione_di', { p_utente: u.id })
        const { data: file } = await db.storage.from('foto').list(u.id, { limit: 1000 })
        if (file?.length) await db.storage.from('foto').remove(file.map((f) => `${u.id}/${f.name}`))
        if (!(await db.auth.admin.deleteUser(u.id)).error) cancellati++
      } else if (ultimo < limite23) {
        const { count } = await db
          .from('notifiche')
          .select('id', { count: 'exact', head: true })
          .eq('utente', u.id)
          .eq('tipo', 'inattivo')
        if (!count) {
          await db.from('notifiche').insert({
            utente: u.id,
            tipo: 'inattivo',
            testo: 'Non entri da quasi 2 anni: tra un mese cancelliamo il tuo account. Basta entrare per tenerlo.',
            link: '/',
          })
          avvisati++
        }
      }
    }
    if (data.users.length < 200) break
  }
  fatto.account_avvisati = avvisati
  fatto.account_cancellati = cancellati

  return NextResponse.json({ ok: true, fatto })
}
