import { ImageResponse } from 'next/og'

// Anteprima quando qualcuno condivide il link (WhatsApp, Facebook, Telegram)
export const alt = 'TaskEase: aiuto per la casa a Forlì e Cesena'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Immagine() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#0E1C19',
          color: '#F3EDE2',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, color: '#E6BE80' }}>TaskEase</div>
        <div style={{ fontSize: 44, marginTop: 24, maxWidth: 950, lineHeight: 1.3 }}>
          Chi lavora vicino a casa tua a Forlì e Cesena, giudicato solo da chi l’ha davvero chiamato.
        </div>
      </div>
    ),
    size,
  )
}
