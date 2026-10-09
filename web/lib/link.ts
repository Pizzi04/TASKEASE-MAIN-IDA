// Solo collegamenti interni all'app: "/qualcosa", mai "//sito.it" o "/\sito.it"
export function linkInterno(link: string | null | undefined, ripiego = '/'): string {
  return typeof link === 'string' && /^\/(?![/\\])/.test(link) ? link : ripiego
}
