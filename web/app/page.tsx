import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/supabase/server'
import { mostraTelefono } from '@/lib/validazione'

export default async function Home() {
  const { supabase, id, telefono } = await utenteCorrente()
  if (!id) redirect('/accedi')

  const { data: profilo, error } = await supabase
    .from('profili')
    .select('nome, zona, ruolo, creato_il')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Non riesco a leggere il profilo')
  if (!profilo) redirect('/profilo/nuovo')

  return (
    <>
      <p className="marchio">TaskEase</p>
      <h1>Ciao {profilo.nome}</h1>
      <p>Il tuo account è attivo. Le prossime parti dell’app arriveranno qui.</p>

      <section className="scheda" aria-label="Il tuo profilo">
        <div className="riga"><span>Telefono</span><span>{telefono ? mostraTelefono('+' + telefono.replace(/^\+/, '')) : '—'}</span></div>
        <div className="riga"><span>Zona</span><span>{profilo.zona}</span></div>
        <div className="riga"><span>Iscritto dal</span><span>{new Date(profilo.creato_il).toLocaleDateString('it-IT')}</span></div>
      </section>

      <form action="/esci" method="post">
        <button className="secondario" type="submit">Esci</button>
      </form>
    </>
  )
}
