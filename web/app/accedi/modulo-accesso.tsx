'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CHIAVE_CAPTCHA, Captcha } from '@/components/Captcha'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { codiceOtpValido, mostraTelefono, normalizzaTelefono } from '@/lib/validazione'

function messaggioErrore(e: { message?: string; status?: number; code?: string } | null): string {
  if (!e) return 'Qualcosa non ha funzionato. Riprova.'
  if (e.code === 'captcha_failed' || /captcha/i.test(e.message ?? '')) return 'Il controllo di sicurezza non è andato: riprova.'
  if (e.status === 429 || e.code === 'over_sms_send_rate_limit') return 'Troppi tentativi. Aspetta un minuto e riprova.'
  if (e.code === 'otp_expired' || /expired|invalid/i.test(e.message ?? '')) return 'Codice sbagliato o scaduto.'
  if (e.code === 'phone_provider_disabled' || /provider/i.test(e.message ?? '')) return 'L’accesso via SMS non è ancora attivo. Riprova più tardi.'
  return 'Qualcosa non ha funzionato. Riprova.'
}

export default function ModuloAccesso({ dopo = '/' }: { dopo?: string }) {
  const router = useRouter()
  const [passo, setPasso] = useState<'numero' | 'codice'>('numero')
  const [numero, setNumero] = useState('')
  const [telefono, setTelefono] = useState('')
  const [codice, setCodice] = useState('')
  const [errore, setErrore] = useState('')
  const [attesa, setAttesa] = useState(false)
  const [reinvio, setReinvio] = useState(false)
  const [rimandato, setRimandato] = useState(false)
  const [captcha, setCaptcha] = useState('')
  const [versioneCaptcha, setVersioneCaptcha] = useState(0)
  const prendiCaptcha = useCallback((t: string) => setCaptcha(t), [])
  // Secondi prima di poter chiedere un altro codice
  const [mancano, setMancano] = useState(0)
  useEffect(() => {
    if (mancano <= 0) return
    const t = setTimeout(() => setMancano((m) => m - 1), 1000)
    return () => clearTimeout(t)
  }, [mancano])

  // Manda l'SMS; true se è partito
  async function manda(tel: string, diNuovo = false): Promise<boolean> {
    if (CHIAVE_CAPTCHA && !captcha) {
      setErrore('Completa il controllo di sicurezza qui sotto.')
      return false
    }
    setErrore('')
    if (!diNuovo) setAttesa(true)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.signInWithOtp({ phone: tel, options: CHIAVE_CAPTCHA ? { captchaToken: captcha } : undefined })
    setAttesa(false)
    // Il token vale una volta sola: se serve un altro invio, se ne chiede uno nuovo
    setCaptcha('')
    setVersioneCaptcha((v) => v + 1)
    supabase.rpc('registra_evento', { p_nome: 'accesso_avviato' }).then(() => {}, () => {})
    if (error) {
      setErrore(messaggioErrore(error))
      return false
    }
    setMancano(60)
    return true
  }

  async function inviaCodice(e: React.FormEvent) {
    e.preventDefault()
    const tel = normalizzaTelefono(numero)
    if (!tel) {
      setErrore('Scrivi un cellulare italiano, per esempio 333 123 4567.')
      return
    }
    if (!(await manda(tel))) return
    setTelefono(tel)
    setCodice('')
    setPasso('codice')
  }

  async function verifica(e: React.FormEvent) {
    e.preventDefault()
    if (!codiceOtpValido(codice)) {
      setErrore('Il codice ha 6 cifre.')
      return
    }
    setErrore('')
    setAttesa(true)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.verifyOtp({ phone: telefono, token: codice.trim(), type: 'sms' })
    if (error) {
      setAttesa(false)
      return setErrore(messaggioErrore(error))
    }
    await supabase.rpc('registra_evento', { p_nome: 'accesso_riuscito' }).then(() => {}, () => {})
    router.replace(dopo)
    router.refresh()
  }

  if (passo === 'numero') {
    return (
      <form className="scheda" method="post" onSubmit={inviaCodice} noValidate>
        <label htmlFor="numero">Cellulare</label>
        <input
          id="numero"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="333 123 4567"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          aria-invalid={errore ? true : undefined}
          aria-describedby={errore ? 'errore' : undefined}
          autoFocus
        />
        <Captcha onToken={prendiCaptcha} versione={versioneCaptcha} />
        {errore && <p className="errore" id="errore" role="alert">{errore}</p>}
        <button className="bottone" type="submit" disabled={attesa}>
          {attesa ? 'Invio…' : 'Mandami il codice'}
        </button>
      </form>
    )
  }

  return (
    <form className="scheda" method="post" onSubmit={verifica} noValidate>
      <label htmlFor="codice">Codice ricevuto al {mostraTelefono(telefono)}</label>
      <input
        id="codice"
        className="codice"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={codice}
        onChange={(e) => setCodice(e.target.value.replace(/\D/g, ''))}
        aria-invalid={errore ? true : undefined}
        aria-describedby={errore ? 'errore' : undefined}
        autoFocus
      />
      {errore && <p className="errore" id="errore" role="alert">{errore}</p>}
      <button className="bottone" type="submit" disabled={attesa}>
        {attesa ? 'Controllo…' : 'Entra'}
      </button>
      <p className="nascosto" role="status">
        {rimandato && mancano > 0 ? 'Nuovo codice inviato.' : ''}
      </p>
      {mancano > 0 ? (
        <p className="nota">
          Non arriva? Puoi chiederne un altro tra <span aria-hidden="true">{mancano} s</span>
          <span className="nascosto">un minuto</span>.
        </p>
      ) : (
        <>
          <Captcha onToken={prendiCaptcha} versione={versioneCaptcha} />
          <button
            className="secondario"
            type="button"
            disabled={attesa || reinvio}
            onClick={async () => {
              setReinvio(true)
              if (await manda(telefono, true)) {
                setCodice('')
                setRimandato(true)
              }
              setReinvio(false)
            }}
          >
            {reinvio ? 'Invio…' : 'Rimanda il codice'}
          </button>
        </>
      )}
      <button
        className="secondario"
        type="button"
        onClick={() => {
          setPasso('numero')
          setErrore('')
        }}
      >
        Cambia numero
      </button>
    </form>
  )
}
