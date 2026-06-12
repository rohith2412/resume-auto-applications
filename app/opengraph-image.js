/* ════════════════════════════════════════════════════════════════════════════
   OPEN GRAPH IMAGE — auto-generated 1200x630 PNG for social sharing
   ──────────────────────────────────────────────────────────────────────────
   Just the shamrock logo, centered, on white. No headline, no tagline.
   ════════════════════════════════════════════════════════════════════════════ */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'reblet'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width:  '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {/* Shamrock mascot — black rounded square + green clover emoji */}
        <div style={{
          width: 320,
          height: 320,
          borderRadius: 72,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 220,
          color: '#fff',
          boxShadow: '0 16px 48px rgba(0,0,0,.22)',
        }}>
          ☘
        </div>
      </div>
    ),
    { ...size }
  )
}
