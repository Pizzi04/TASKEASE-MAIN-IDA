'use client'

import { useLayoutEffect, useRef, useState } from 'react'

// Numero che sale da 0 al valore quando compare. Una volta sola, e mai con "riduci movimento".
// Sul server e senza JavaScript mostra subito il valore giusto; se il valore cambia dopo, si aggiorna e basta.
export function Conta({ a, ms = 900 }: { a: number; ms?: number }) {
  const [v, setV] = useState(a)
  const fatto = useRef(false)
  // Prima del disegno, così non si vede il numero finale lampeggiare prima di ripartire da 0
  useLayoutEffect(() => {
    if (fatto.current || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(a)
      return
    }
    fatto.current = true
    let raf = 0
    let t0: number | undefined
    setV(0)
    const passo = (t: number) => {
      t0 ??= t
      const k = Math.min(1, (t - t0) / ms)
      setV(Math.round(a * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(raf)
      setV(a)
    }
  }, [a, ms])
  return <>{v}</>
}
