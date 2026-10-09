import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LEGALE, titolareCompleto } from '@/lib/legale'

export function generateStaticParams() {
  return Object.keys(LEGALE).map((doc) => ({ doc }))
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params
  return { title: `${LEGALE[doc]?.t ?? 'Documento'} · TaskEase` }
}

export default async function Documento({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params
  const d = LEGALE[doc]
  if (!d) notFound()
  return (
    <>
      <Link href="/" className="marchio">
        TaskEase
      </Link>
      <h1>{d.t}</h1>
      {!titolareCompleto && <p className="avviso">Bozza: mancano ancora i dati di chi gestisce TaskEase.</p>}
      {d.s.map(([titolo, testo]) => (
        <section key={titolo}>
          <h2>{titolo}</h2>
          <p>{testo}</p>
        </section>
      ))}
      <nav className="menu" aria-label="Altri documenti">
        {Object.entries(LEGALE)
          .filter(([k]) => k !== doc)
          .map(([k, v]) => (
            <Link key={k} href={`/legale/${k}`}>
              {v.t}
            </Link>
          ))}
      </nav>
    </>
  )
}
