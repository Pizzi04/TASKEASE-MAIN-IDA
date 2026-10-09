import { Avatar } from '@/components/Avatar'
import { Modulo } from '@/components/Modulo'
import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { ZONE } from '@/lib/validazione'
import { modificaProfilo } from '../azioni'

export const metadata = { title: 'Modifica profilo · TaskEase' }

export default async function ModificaProfilo() {
  const { profilo } = await richiediProfilo()
  return (
    <>
      <Testata titolo="Modifica profilo" indietro="/profilo" />
      <Modulo azione={modificaProfilo} invio="Salva" inCorso="Salvo…">
        <label htmlFor="nome">Nome e cognome</label>
        <input id="nome" name="nome" type="text" autoComplete="name" maxLength={60} defaultValue={profilo.nome} required />
        <label htmlFor="zona">Zona</label>
        <select id="zona" name="zona" defaultValue={profilo.zona}>
          {ZONE.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
        <label htmlFor="foto">Foto</label>
        <div className="riga-foto">
          <Avatar nome={profilo.nome} foto={profilo.foto} lato={56} />
          <input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
        {profilo.foto && (
          <label className="spunta">
            <input type="checkbox" name="togli_foto" value="si" />
            <span>Togli la foto</span>
          </label>
        )}
        <p className="nota">Per chi lavora la foto è consigliata: i clienti si fidano di più.</p>
      </Modulo>
    </>
  )
}
