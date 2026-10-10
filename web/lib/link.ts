// Solo collegamenti interni all'app: "/qualcosa", mai "//sito.it", "/\sito.it" o "/\t/sito.it"
export function linkInterno(link: string | null | undefined, ripiego = '/'): string {
  if (typeof link !== 'string' || !/^\/(?![/\\])/.test(link) || /[\u0000-\u001f\u007f\\]/.test(link)) return ripiego
  try {
    const base = 'http://interno.invalid'
    const u = new URL(link, base)
    const fuori = u.pathname + u.search + u.hash
    // Si controlla anche il risultato: "/.//sito.it" diventa "//sito.it" dopo la normalizzazione
    return u.origin === base && /^\/(?![/\\])/.test(fuori) ? fuori : ripiego
  } catch {
    return ripiego
  }
}
