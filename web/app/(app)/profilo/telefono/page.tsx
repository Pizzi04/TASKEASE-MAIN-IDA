import { Testata } from '@/components/Testata'
import { richiediProfilo } from '@/lib/supabase/server'
import { mostraTelefono } from '@/lib/validazione'
import CambiaTelefono from './cambia-telefono'

export const metadata = { title: 'Cambia numero · TaskEase' }

export default async function Telefono() {
  const { telefono } = await richiediProfilo()
  return (
    <>
      <Testata titolo="Cambia numero" indietro="/profilo" sotto={telefono ? `Ora: ${mostraTelefono(telefono)}` : undefined} />
      <p className="nota">Ti mandiamo un codice al nuovo numero. Prenotazioni, giudizi e IDA restano tuoi.</p>
      <CambiaTelefono />
    </>
  )
}
