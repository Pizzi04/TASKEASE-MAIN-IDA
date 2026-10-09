import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TaskEase',
    short_name: 'TaskEase',
    description: 'Chi lavora vicino a casa tua a Forlì e Cesena, giudicato solo da chi l’ha davvero chiamato.',
    lang: 'it',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0E1C19',
    theme_color: '#0E1C19',
    categories: ['lifestyle', 'utilities'],
    icons: [
      { src: '/icona-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Cerca', url: '/cerca' },
      { name: 'Prenotazioni', url: '/prenotazioni' },
      { name: 'Bacheca', url: '/bacheca' },
    ],
  }
}
