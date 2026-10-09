import { configSupabase } from './supabase/config'

// Indirizzo pubblico di una foto salvata nell'archivio "foto"
export function urlFoto(percorso: string | null | undefined): string | null {
  if (!percorso) return null
  return `${configSupabase().url}/storage/v1/object/public/foto/${percorso}`
}

export const FOTO_TIPI = ['image/jpeg', 'image/png', 'image/webp']
export const FOTO_MAX = 3 * 1024 * 1024

export function fotoValida(f: File | null): string | null {
  if (!f || f.size === 0) return null
  if (!FOTO_TIPI.includes(f.type)) return 'La foto deve essere JPG, PNG o WebP.'
  if (f.size > FOTO_MAX) return 'La foto è troppo grande (massimo 3 MB).'
  return null
}

export function estensione(tipo: string): string {
  return tipo === 'image/png' ? 'png' : tipo === 'image/webp' ? 'webp' : 'jpg'
}
