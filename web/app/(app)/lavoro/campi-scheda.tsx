import { COMPETENZE, COMPETENZE_IMPIANTI, ZONE } from '@/lib/validazione'

export type ValoriScheda = {
  bio: string
  competenze: string[]
  zone: string[]
  tariffa_oraria: number
  su_preventivo: boolean
  tipo: string
  partita_iva: string | null
  abilitazione_impianti: boolean
  assicurazione_rc: boolean
}

// Campi della scheda pubblica, uguali per "crea" e "modifica"
export function CampiScheda({ v }: { v?: ValoriScheda }) {
  return (
    <>
      <fieldset>
        <legend>Come lavori</legend>
        <label className="spunta">
          <input type="radio" name="tipo" value="privato" defaultChecked={v?.tipo !== 'piva'} />
          <span>Da privato (prestazione occasionale)</span>
        </label>
        <label className="spunta">
          <input type="radio" name="tipo" value="piva" defaultChecked={v?.tipo === 'piva'} />
          <span>Con Partita IVA</span>
        </label>
        <label htmlFor="partita_iva">Partita IVA (solo se ce l’hai)</label>
        <input id="partita_iva" name="partita_iva" type="text" inputMode="numeric" maxLength={13} defaultValue={v?.partita_iva ?? ''} />
      </fieldset>

      <fieldset>
        <legend>Cosa sai fare</legend>
        <div className="griglia-spunte">
          {COMPETENZE.map((c) => (
            <label key={c} className="spunta">
              <input type="checkbox" name="competenze" value={c} defaultChecked={v?.competenze.includes(c)} />
              <span>
                {c}
                {COMPETENZE_IMPIANTI.includes(c) ? ' (solo P.IVA abilitata)' : ''}
              </span>
            </label>
          ))}
        </div>
        <label className="spunta">
          <input type="checkbox" name="abilitazione" value="si" defaultChecked={v?.abilitazione_impianti} />
          <span>Dichiaro di essere un’impresa abilitata agli impianti (DM 37/2008)</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Dove lavori</legend>
        <div className="griglia-spunte">
          {ZONE.map((z) => (
            <label key={z} className="spunta">
              <input type="checkbox" name="zone" value={z} defaultChecked={v?.zone.includes(z)} />
              <span>{z}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="tariffa">Tariffa (€ l’ora)</label>
      <input id="tariffa" name="tariffa" type="number" min={5} max={200} step={1} defaultValue={v?.tariffa_oraria ?? 20} required />
      <label className="spunta">
        <input type="checkbox" name="su_preventivo" value="si" defaultChecked={v?.su_preventivo} />
        <span>Preferisco fare un preventivo prima</span>
      </label>
      <label className="spunta">
        <input type="checkbox" name="assicurazione" value="si" defaultChecked={v?.assicurazione_rc} />
        <span>Ho un’assicurazione di responsabilità civile</span>
      </label>

      <label htmlFor="bio">Presentati in due righe</label>
      <textarea id="bio" name="bio" rows={3} maxLength={300} defaultValue={v?.bio ?? ''} placeholder="Es. Monto mobili da 10 anni, lavoro pulito e puntuale." />
      <p className="nota">Niente telefono o indirizzo: i clienti ti scrivono in chat.</p>
    </>
  )
}
