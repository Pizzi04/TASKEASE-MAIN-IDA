'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { codiceOtpValido, mostraTelefono, normalizzaTelefono } from '@/lib/validazione'

function messaggio(e: { message?: string; status?: number; code?: string }): string {
  if (e.code === 'phone_exists' || /already/i.test(e.message ?? '')) return 'Questo numero è già usato da un altro account.'
  if (e.status === 429) return 'Troppi tentativi. Aspetta un minuto e riprova.'
  if (/expired|invalid/i.test(e.message ?? '')) return 'Codice sbagliato o scaduto.'
  return 'Non è andata. Riprova tra poco.'
}

// Cambio del numero: codice al nuovo numero, poi conferma (Supabase "phone_change")
export default function CambiaTelefono() {
  const router = useRouter()
  const [numero, setNumero] = useState('')
  const [nuovo, setNuovo] = useState('')
  const [codice, setCodice] = useState('')
  const [errore, setErrore] = useState('')
  const [fatto, setFatto] = useState(false)
  const [attesa, setAttesa] = useState(false)

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    const tel = normalizzaTelefono(numero)
    if (!tel) return setErrore('Scrivi un cellulare italiano, per esempio 333 123 4567.')
    setErrore('')
    setAttesa(true)
    const { error } = await supabaseBrowser().auth.updateUser({ phone: tel })
    setAttesa(false)
    if (error) return setErrore(messaggio(error))
    setNuovo(tel)
  }

  async function conferma(e: React.FormEvent) {
    e.preventDefault()
    if (!codiceOtpValido(codice)) return setErrore('Il codice ha 6 cifre.')
    setErrore('')
    setAttesa(true)
    const { error } = await supabaseBrowser().auth.verifyOtp({ phone: nuovo, token: codice.trim(), type: 'phone_change' })
    setAttesa(false)
    if (error) return setErrore(messaggio(error))
    setFatto(true)
    router.refresh()
  }

  if (fatto) return <p className="conferma">Fatto: ora accedi con {mostraTelefono(nuovo)}.</p>

  return nuovo ? (
    <form className="scheda" onSubmit={conferma} noValidate>
      <label htmlFor="codice">Codice ricevuto al {mostraTelefono(nuovo)}</label>
      <input
        id="codice"
        className="codice"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={codice}
        onChange={(e) => setCodice(e.target.value.replace(/\D/g, ''))}
        autoFocus
      />
      {errore && <p className="errore" role="alert">{errore}</p>}
      <button className="bottone" type="submit" disabled={attesa}>
        {attesa ? 'Controllo…' : 'Conferma il nuovo numero'}
      </button>
      <button type="button" className="secondario" onClick={() => setNuovo('')}>
        Ho sbagliato numero
      </button>
    </form>
  ) : (
    <form className="scheda" onSubmit={invia} noValidate>
      <label htmlFor="numero">Nuovo cellulare</label>
      <input id="numero" type="tel" inputMode="tel" autoComplete="tel" placeholder="333 123 4567" value={numero} onChange={(e) => setNumero(e.target.value)} />
      {errore && <p className="errore" role="alert">{errore}</p>}
      <button className="bottone" type="submit" disabled={attesa}>
        {attesa ? 'Invio…' : 'Mandami il codice'}
      </button>
    </form>
  )
}
