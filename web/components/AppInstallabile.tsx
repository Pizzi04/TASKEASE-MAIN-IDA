'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

type EventoInstalla = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// Registra il service worker e offre "Installa l'app" quando il browser lo permette
export function RegistraSw() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {})
    }
    const installata = () => supabaseBrowser().rpc('registra_evento', { p_nome: 'app_installata' }).then(() => {}, () => {})
    window.addEventListener('appinstalled', installata)
    return () => window.removeEventListener('appinstalled', installata)
  }, [])
  return null
}

// Valori del browser letti senza effetti: sul server valgono il secondo argomento
const nessunCambio = () => () => {}
function useBrowser<T>(leggi: () => T, sulServer: T): T {
  return useSyncExternalStore(nessunCambio, leggi, () => sulServer)
}

export function InstallaApp() {
  const [evento, setEvento] = useState<EventoInstalla | null>(null)
  const giaInstallata = useBrowser(() => window.matchMedia('(display-mode: standalone)').matches, true)
  const ios = useBrowser(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window), false)

  useEffect(() => {
    const prendi = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalla)
    }
    window.addEventListener('beforeinstallprompt', prendi)
    return () => window.removeEventListener('beforeinstallprompt', prendi)
  }, [])

  if (giaInstallata) return null
  if (evento)
    return (
      <button
        type="button"
        className="secondario"
        onClick={async () => {
          await evento.prompt()
          setEvento(null)
        }}
      >
        Installa l’app sul telefono
      </button>
    )
  if (ios) return <p className="nota">Per installare l’app: tocca Condividi ⎋ e poi “Aggiungi alla schermata Home”.</p>
  return null
}

function base64InUint8(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// Attiva o spegne le notifiche push su questo dispositivo
export function NotifichePush({ utente }: { utente: string }) {
  const chiave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const supportato = useBrowser(
    () => !!chiave && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined',
    true,
  )
  const negato = useBrowser(() => typeof Notification !== 'undefined' && Notification.permission === 'denied', false)
  const [stato, setStato] = useState<'non-supportato' | 'spente' | 'attive' | 'bloccate' | 'attesa'>('attesa')
  const [errore, setErrore] = useState('')

  // Iscrizione già presente su questo dispositivo? (lo stato si aggiorna nella callback, non nell'effetto)
  useEffect(() => {
    if (!supportato || negato) return
    navigator.serviceWorker.ready
      .then((r) => r.pushManager.getSubscription())
      .then((s) => setStato(s ? 'attive' : 'spente'))
      .catch(() => setStato('non-supportato'))
  }, [supportato, negato])

  if (!supportato || stato === 'non-supportato')
    return <p className="nota">Le notifiche sul telefono funzionano dall’app installata (su iPhone da iOS 16.4).</p>
  if (negato || stato === 'bloccate') return <p className="nota">Hai bloccato le notifiche: riattivale dalle impostazioni del browser.</p>

  const attiva = async () => {
    setErrore('')
    setStato('attesa')
    try {
      const reg = await navigator.serviceWorker.ready
      const iscrizione = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64InUint8(chiave!) })
      const j = iscrizione.toJSON()
      const { error } = await supabaseBrowser()
        .from('push_iscrizioni')
        .insert({ utente, endpoint: j.endpoint!, p256dh: j.keys!.p256dh, auth: j.keys!.auth })
      if (error && error.code !== '23505') throw error
      setStato('attive')
    } catch {
      setErrore('Non sono riuscito ad attivarle. Hai dato il permesso?')
      setStato(Notification.permission === 'denied' ? 'bloccate' : 'spente')
    }
  }
  const spegni = async () => {
    setStato('attesa')
    const reg = await navigator.serviceWorker.ready
    const s = await reg.pushManager.getSubscription()
    if (s) {
      await supabaseBrowser().from('push_iscrizioni').delete().eq('endpoint', s.endpoint)
      await s.unsubscribe()
    }
    setStato('spente')
  }

  return (
    <div className="scheda interruttore">
      <div>
        <b>Notifiche sul telefono</b>
        <p className="nota">Prenotazioni, messaggi e giudizi, anche ad app chiusa.</p>
        {errore && <p className="errore">{errore}</p>}
      </div>
      <button type="button" className="secondario" role="switch" aria-checked={stato === 'attive'} disabled={stato === 'attesa'} onClick={stato === 'attive' ? spegni : attiva}>
        {stato === 'attive' ? 'Spegni' : 'Attiva'}
      </button>
    </div>
  )
}
