import Image from 'next/image'
import { urlFoto } from '@/lib/foto'

// Prima lettera della prima e dell'ultima parola. Si prendono solo lettere o cifre intere:
// mezza emoji diventa "�" sul server ma non nel browser (errore di idratazione).
export function iniziali(nome: string): string {
  const lettere = nome
    .split(/\s+/)
    .map((p) => p.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((l): l is string => !!l)
  if (!lettere.length) return '?'
  return (lettere[0] + (lettere.length > 1 ? lettere[lettere.length - 1] : '')).toUpperCase()
}

export function Avatar({ nome, foto, lato = 48 }: { nome: string; foto?: string | null; lato?: number }) {
  const url = urlFoto(foto)
  return (
    <span className="avatar" style={{ width: lato, height: lato, fontSize: lato * 0.36 }} aria-hidden="true">
      {url ? <Image src={url} alt="" width={lato} height={lato} sizes={`${lato}px`} /> : iniziali(nome)}
    </span>
  )
}
