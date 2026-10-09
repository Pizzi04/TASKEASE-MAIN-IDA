'use client'

import { createContext, startTransition, useActionState, useContext } from 'react'
import { useFormStatus } from 'react-dom'

export type StatoAzione = { errore?: string; ok?: string } | null
export type Azione = (prima: StatoAzione, form: FormData) => Promise<StatoAzione>

const Inviando = createContext<boolean | null>(null)

// Invia il modulo all'azione server SENZA svuotare i campi (React lo farebbe con <form action>):
// se c'è un errore, quello che hai scritto resta.
export function useAzione(azione: Azione) {
  const [stato, invia, inCorso] = useActionState(azione, null)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null
    const dati = new FormData(e.currentTarget, submitter)
    startTransition(() => invia(dati))
  }
  return { stato, onSubmit, inCorso }
}

export function Esito({ stato }: { stato: StatoAzione }) {
  if (stato?.errore)
    return (
      <p className="errore" role="alert">
        {stato.errore}
      </p>
    )
  if (stato?.ok)
    return (
      <p className="conferma" role="status">
        {stato.ok}
      </p>
    )
  return null
}

// Modulo collegato a un'azione server: mostra l'errore o la conferma restituiti.
export function Modulo({
  azione,
  children,
  className = 'scheda',
  invio,
  inCorso = 'Un attimo…',
  tipo = 'bottone',
}: {
  azione: Azione
  children: React.ReactNode
  className?: string
  invio: string
  inCorso?: string
  tipo?: 'bottone' | 'pericolo' | 'secondario'
}) {
  const { stato, onSubmit, inCorso: pending } = useAzione(azione)
  return (
    <Inviando.Provider value={pending}>
      <form className={className} onSubmit={onSubmit} noValidate>
        {children}
        <Esito stato={stato} />
        <BottoneInvio testo={invio} inCorso={inCorso} tipo={tipo} />
      </form>
    </Inviando.Provider>
  )
}

export function ProviderInvio({ inCorso, children }: { inCorso: boolean; children: React.ReactNode }) {
  return <Inviando.Provider value={inCorso}>{children}</Inviando.Provider>
}

export function BottoneInvio({
  testo,
  inCorso = 'Un attimo…',
  tipo = 'bottone',
  nome,
  valore,
}: {
  testo: string
  inCorso?: string
  tipo?: 'bottone' | 'pericolo' | 'secondario' | 'piccolo'
  nome?: string
  valore?: string
}) {
  const daModulo = useContext(Inviando)
  const { pending } = useFormStatus()
  const attesa = daModulo ?? pending
  return (
    <button className={tipo} type="submit" disabled={attesa} name={nome} value={valore} aria-busy={attesa || undefined}>
      {attesa ? inCorso : testo}
    </button>
  )
}
