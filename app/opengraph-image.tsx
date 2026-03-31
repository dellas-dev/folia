import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #faf7f2 0%, #edf4e8 100%)',
          padding: '64px',
          color: '#1d2b1f',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: '#7da07e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '34px',
            }}
          >
            F
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>Folia</div>
            <div style={{ fontSize: '22px', color: '#506351' }}>AI clipart and mockups for Etsy sellers</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '900px' }}>
          <div style={{ fontSize: '68px', lineHeight: 1.05, fontWeight: 700 }}>
            Create commercial-ready assets faster.
          </div>
          <div style={{ fontSize: '30px', lineHeight: 1.4, color: '#506351' }}>
            Generate clipart elements, themed illustration packs, and invitation mockups for your next product listing.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '18px' }}>
          {['Watercolor', 'Line Art', 'Boho', 'Mockups'].map((item) => (
            <div
              key={item}
              style={{
                border: '1px solid rgba(80, 99, 81, 0.2)',
                borderRadius: '999px',
                padding: '12px 22px',
                fontSize: '22px',
                color: '#375338',
                background: 'rgba(255,255,255,0.65)',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
