import { configSupabase } from './supabase/config'

// Indirizzo pubblico di una foto salvata nell'archivio "foto"
export function urlFoto(percorso: string | null | undefined): string | null {
  if (!percorso) return null
  return `${configSupabase().url}/storage/v1/object/public/foto/${percorso}`
}

export const FOTO_TIPI = ['image/jpeg', 'image/png', 'image/webp']
export const FOTO_MAX = 3 * 1024 * 1024

// Il tipo dichiarato dal browser non basta: si guardano i primi byte del file
export function tipoDaiByte(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  const testo = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n))
  if (testo(0, 4) === 'RIFF' && testo(8, 4) === 'WEBP') return 'image/webp'
  return null
}

export async function fotoValida(f: File | null): Promise<string | null> {
  if (!f || f.size === 0) return null
  if (!FOTO_TIPI.includes(f.type)) return 'La foto deve essere JPG, PNG o WebP.'
  if (f.size > FOTO_MAX) return 'La foto è troppo grande (massimo 3 MB).'
  const vero = tipoDaiByte(new Uint8Array(await f.slice(0, 12).arrayBuffer()))
  if (vero !== f.type) return 'Il file non sembra una foto valida: prova con un’altra immagine.'
  return null
}

export function estensione(tipo: string): string {
  return tipo === 'image/png' ? 'png' : tipo === 'image/webp' ? 'webp' : 'jpg'
}
