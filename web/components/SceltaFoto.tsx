'use client'

import { useState } from 'react'

// Campo foto con testi in italiano (quello nativo del browser segue la lingua del sistema)
export default function SceltaFoto({ id = 'foto', name = 'foto' }: { id?: string; name?: string }) {
  const [scelta, setScelta] = useState('')
  return (
    <span className="scelta-foto">
      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="nascosto"
        onChange={(e) => setScelta(e.target.files?.[0]?.name ?? '')}
      />
      <label htmlFor={id} className="secondario">
        Scegli una foto
      </label>
      <span className="nota">{scelta || 'Nessuna foto scelta'}</span>
    </span>
  )
}
