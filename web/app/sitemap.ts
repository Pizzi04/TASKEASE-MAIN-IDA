import type { MetadataRoute } from 'next'
import { PAGINE_PUBBLICHE, urlSito } from '@/lib/sito'

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGINE_PUBBLICHE.map((p) => ({ url: new URL(p, urlSito()).toString(), changeFrequency: 'monthly' }))
}
