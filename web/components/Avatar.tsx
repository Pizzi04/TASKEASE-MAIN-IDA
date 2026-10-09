import Image from 'next/image'
import { urlFoto } from '@/lib/foto'

export function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/)
  return ((parti[0]?.[0] ?? '') + (parti.length > 1 ? parti[parti.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ nome, foto, lato = 48 }: { nome: string; foto?: string | null; lato?: number }) {
  const url = urlFoto(foto)
  return (
    <span className="avatar" style={{ width: lato, height: lato, fontSize: lato * 0.36 }} aria-hidden="true">
      {url ? <Image src={url} alt="" width={lato} height={lato} sizes={`${lato}px`} /> : iniziali(nome)}
    </span>
  )
}
