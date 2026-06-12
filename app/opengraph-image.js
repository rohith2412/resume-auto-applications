/* ════════════════════════════════════════════════════════════════════════════
   OPEN GRAPH IMAGE — auto-generated 1200x630 PNG for social sharing
   ──────────────────────────────────────────────────────────────────────────
   Minimal: shamrock mascot + "LinkedIn Auto Apply with AI" headline.
   No banner, no stats, no CTA.
   ════════════════════════════════════════════════════════════════════════════ */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'reblet — LinkedIn Auto Apply with AI'
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          gap: 48,
        }}
      >
        {/* Shamrock mascot */}
        <div style={{
          width: 200,
          height: 200,
          borderRadius: 44,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 140,
          color: '#fff',
          boxShadow: '0 12px 36px rgba(0,0,0,.18)',
        }}>
          ☘
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 92,
          fontWeight: 800,
          color: '#0a0a0a',
          letterSpacing: '-0.045em',
          lineHeight: 1.05,
          textAlign: 'center',
          maxWidth: 1000,
        }}>
          LinkedIn Auto Apply with AI
        </div>
      </div>
    ),
    { ...size }
  )
}
