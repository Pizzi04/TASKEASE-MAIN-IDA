export function configSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chiave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !chiave) {
    throw new Error('Mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: copia .env.example in .env.local')
  }
  return { url, chiave }
}
