import Link from 'next/link'
import { Modulo } from '@/components/Modulo'
import { DOCUMENTI, ZONE } from '@/lib/validazione'
import { creaProfilo } from './azioni'

export default function ModuloProfilo() {
  return (
    <Modulo azione={creaProfilo} invio="Crea il profilo" inCorso="Salvo…">
      <fieldset>
        <legend>Cosa vuoi fare su TaskEase?</legend>
        <label className="spunta">
          <input type="radio" name="intento" value="cerco" defaultChecked />
          <span>Cerco aiuto per casa</span>
        </label>
        <label className="spunta">
          <input type="radio" name="intento" value="lavoro" />
          <span>Voglio offrire i miei servizi</span>
        </label>
        <p className="nota">Puoi fare entrambe le cose: si cambia in un tocco dalla home.</p>
      </fieldset>

      <label htmlFor="nome">Nome e cognome</label>
      <input id="nome" name="nome" type="text" autoComplete="name" minLength={2} maxLength={60} required />

      <label htmlFor="zona">Zona</label>
      <select id="zona" name="zona" required defaultValue="">
        <option value="" disabled>
          Scegli…
        </option>
        {ZONE.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>

      <label className="spunta">
        <input type="checkbox" name="consenso" value="si" required />
        <span>
          Accetto i <Link href="/legale/termini">termini d’uso</Link> e ho letto l’<Link href="/legale/privacy">informativa privacy</Link>{' '}
          (versione {DOCUMENTI[0].versione}).
        </span>
      </label>
      <p className="nota">Il numero di telefono non viene mostrato a nessuno.</p>
    </Modulo>
  )
}
