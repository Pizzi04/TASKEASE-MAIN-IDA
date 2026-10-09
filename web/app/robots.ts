import type { MetadataRoute } from 'next'
import { PAGINE_PUBBLICHE, urlSito } from '@/lib/sito'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: [...PAGINE_PUBBLICHE], disallow: ['/'] },
    sitemap: new URL('/sitemap.xml', urlSito()).toString(),
  }
}
