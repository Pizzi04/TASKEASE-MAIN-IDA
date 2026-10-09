'use client'

import { useEffect, useRef, useState } from 'react'

// Numero che sale da 0 al valore quando compare. Una volta sola, e mai con "riduci movimento".
// Sul server e senza JavaScript mostra subito il valore giusto.
export function Conta({ a, ms = 900 }: { a: number; ms?: number }) {
  const [v, setV] = useState(a)
  const fatto = useRef(false)
  useEffect(() => {
    if (fatto.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    fatto.current = true
    let raf = 0
    let t0: number | undefined
    const passo = (t: number) => {
      t0 ??= t
      const k = Math.min(1, (t - t0) / ms)
      setV(Math.round(a * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [a, ms])
  return <>{v}</>
}
