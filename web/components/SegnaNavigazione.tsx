'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Tiene la pila delle pagine visitate dentro l'app in questa scheda: serve a Indietro per sapere
// se c'è una pagina precedente. Tornando alla penultima pagina la pila si accorcia.
export function SegnaNavigazione() {
  const percorso = usePathname()
  useEffect(() => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      let pila: string[] = JSON.parse(sessionStorage.getItem('ta_pila') ?? '[]')
      // Un ingresso nuovo (link diretto, app installata) riparte da zero
      if (!sessionStorage.getItem('ta_pila_viva') && nav?.type === 'navigate') pila = []
      sessionStorage.setItem('ta_pila_viva', '1')
      if (pila.at(-1) === percorso) return
      if (pila.at(-2) === percorso) pila.pop()
      else pila.push(percorso)
      sessionStorage.setItem('ta_pila', JSON.stringify(pila.slice(-50)))
    } catch {}
  }, [percorso])
  return null
}

export function puoTornareIndietro(): boolean {
  try {
    return JSON.parse(sessionStorage.getItem('ta_pila') ?? '[]').length > 1
  } catch {
    return false
  }
}
