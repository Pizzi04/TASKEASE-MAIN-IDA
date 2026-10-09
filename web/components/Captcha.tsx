'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type Turnstile = {
  render: (el: HTMLElement, opzioni: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

export const CHIAVE_CAPTCHA = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

// Cloudflare Turnstile: il controllo "sei una persona" prima di mandare l'SMS.
// Senza chiave configurata non mostra nulla (sviluppo locale).
export function Captcha({ onToken, versione }: { onToken: (t: string) => void; versione: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [pronto, setPronto] = useState(() => typeof window !== 'undefined' && !!window.turnstile)

  useEffect(() => {
    if (!CHIAVE_CAPTCHA || !pronto || !box.current || !window.turnstile) return
    const id = window.turnstile.render(box.current, {
      sitekey: CHIAVE_CAPTCHA,
      language: 'it',
      theme: 'dark',
      callback: (t: string) => onToken(t),
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
    })
    return () => window.turnstile?.remove(id)
  }, [pronto, versione, onToken])

  if (!CHIAVE_CAPTCHA) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setPronto(true)} />
      <div ref={box} className="captcha" />
    </>
  )
}
