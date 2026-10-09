'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BottoneInvio, Esito, ProviderInvio, useAzione } from '@/components/Modulo'
import { ZONE } from '@/lib/validazione'
import { prenota } from '../azioni'

type Giorno = { iso: string; etichetta: string; orari: { ora: string; libero: boolean }[] }

export default function ModuloPrenota(props: {
  professionista: string
  nome: string
  competenze: string[]
  tariffa: number
  suPreventivo: boolean
  giorni: Giorno[]
  zona: string
  post: number | null
  descrizione: string
  competenzaIniziale: string
}) {
  const { stato, onSubmit, inCorso, azione } = useAzione(prenota)
  const primoConOrari = Math.max(0, props.giorni.findIndex((g) => g.orari.some((o) => o.libero)))
  const [giorno, setGiorno] = useState(primoConOrari)
  const [ora, setOra] = useState<string | null>(null)
  const [ore, setOre] = useState<string>('non_so')
  const g = props.giorni[giorno]
  const stima = ore !== 'non_so' && !props.suPreventivo ? Number(ore) * props.tariffa : null

  return (
    <ProviderInvio inCorso={inCorso}>
    <form className="scheda" action={azione} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="professionista" value={props.professionista} />
      {props.post && <input type="hidden" name="post" value={props.post} />}
      <input type="hidden" name="giorno" value={g?.iso ?? ''} />
      <input type="hidden" name="ora" value={ora ?? ''} />

      <label htmlFor="competenza">Cosa ti serve</label>
      <select id="competenza" name="competenza" defaultValue={props.competenzaIniziale}>
        {props.competenze.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <label htmlFor="descrizione">Cosa c’è da fare</label>
      <textarea
        id="descrizione"
        name="descrizione"
        rows={3}
        maxLength={500}
        defaultValue={props.descrizione}
        placeholder="Es. La tapparella della cucina si è bloccata a metà, primo piano."
        required
      />

      <fieldset>
        <legend>Giorno</legend>
        <div className="giorni" role="radiogroup" aria-label="Giorno">
          {props.giorni.map((d, i) => {
            const liberi = d.orari.some((o) => o.libero)
            return (
              <button
                key={d.iso}
                type="button"
                role="radio"
                aria-checked={i === giorno}
                disabled={!liberi}
                onClick={() => {
                  setGiorno(i)
                  setOra(null)
                }}
              >
                {d.etichetta}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Orario</legend>
        <div className="orari" role="radiogroup" aria-label="Orario">
          {g?.orari.map((o) => (
            <button key={o.ora} type="button" role="radio" aria-checked={ora === o.ora} disabled={!o.libero} onClick={() => setOra(o.ora)}>
              {o.ora}
            </button>
          ))}
        </div>
        <p className="nota">Gli orari grigi sono già presi o troppo vicini. {props.nome} conferma o propone un altro orario.</p>
      </fieldset>

      <label htmlFor="ore">Quanto dura?</label>
      <select id="ore" name="ore" value={ore} onChange={(e) => setOre(e.target.value)}>
        <option value="non_so">Non lo so: lo stima {props.nome}</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? 'ora' : 'ore'}
          </option>
        ))}
      </select>
      {stima != null && (
        <p className="nota">
          Circa {stima} € ({props.tariffa} € l’ora). Paghi le ore reali, direttamente a {props.nome}.
        </p>
      )}

      <label htmlFor="indirizzo">Indirizzo</label>
      <input id="indirizzo" name="indirizzo" type="text" autoComplete="street-address" maxLength={200} placeholder="Via, numero civico, città" required />
      <p className="nota">{props.nome} lo vede solo dopo aver confermato.</p>

      <label htmlFor="zona">Zona</label>
      <select id="zona" name="zona" defaultValue={props.zona}>
        {ZONE.map((z) => (
          <option key={z}>{z}</option>
        ))}
      </select>

      <Esito stato={stato} />
      {!ora && <p className="nota">Scegli un orario per inviare.</p>}
      <BottoneInvio testo="Invia la richiesta" inCorso="Invio…" />
      <p className="nota">
        TaskEase non incassa nulla sul lavoro. <Link href="/legale/sicurezza">Consigli di sicurezza</Link>
      </p>
    </form>
    </ProviderInvio>
  )
}
