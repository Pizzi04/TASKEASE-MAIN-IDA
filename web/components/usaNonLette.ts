'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

// Notifiche non lette, aggiornate in tempo reale. "dove" distingue i canali (campanella, barra in basso).
export function useNonLette(utente: string, iniziali: number, dove: string): number {
  const [nonLette, setNonLette] = useState(iniziali)
  useEffect(() => {
    const supabase = supabaseBrowser()
    const ricarica = async () => {
      const { count } = await supabase
        .from('notifiche')
        .select('id', { count: 'exact', head: true })
        .eq('utente', utente)
        .eq('letta', false)
      if (typeof count === 'number') setNonLette(count)
    }
    const canale = supabase
      .channel(`notifiche-${dove}-${utente}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifiche', filter: `utente=eq.${utente}` }, ricarica)
      .subscribe()
    return () => {
      supabase.removeChannel(canale)
    }
  }, [utente, dove])
  return nonLette
}
