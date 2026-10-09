'use client'

import { useActionState } from 'react'
import { ZONE, DOCUMENTI } from '@/lib/validazione'
import { creaProfilo, type StatoProfilo } from './azioni'

export default function ModuloProfilo() {
  const [stato, invia, inCorso] = useActionState<StatoProfilo, FormData>(creaProfilo, null)

  return (
    <form className="scheda" action={invia}>
      <label htmlFor="nome">Nome</label>
      <input id="nome" name="nome" type="text" autoComplete="given-name" minLength={2} maxLength={60} required />

      <label htmlFor="zona">Zona</label>
      <select id="zona" name="zona" required defaultValue="">
        <option value="" disabled>Scegli…</option>
        {ZONE.map((z) => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>

      <label className="spunta">
        <input type="checkbox" name="consenso" value="si" required />
        <span>Accetto i termini d’uso e ho letto l’informativa privacy (versione {DOCUMENTI[0].versione}).</span>
      </label>

      {stato?.errore && <p className="errore" role="alert">{stato.errore}</p>}

      <button className="bottone" type="submit" disabled={inCorso}>
        {inCorso ? 'Salvo…' : 'Crea il profilo'}
      </button>
      <p className="nota">Il numero di telefono non viene mostrato a nessuno.</p>
    </form>
  )
}
