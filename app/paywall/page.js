'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FEATURES = [
  '700 LinkedIn Easy Apply submissions / month',
  'AI fills every screening question',
  'Application tracking dashboard',
  'Chrome extension - set up once',
  'Profile-based personalisation',
]

function LogoMark() {
  return (
    <img src="/shamrock.svg" width="26" height="26" alt="reblet" style={{ flexShrink: 0 }} />
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PaywallContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (success !== 'true') return
    async function activate() {
      if (sessionId) {
        await fetch('/api/stripe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
      }
      router.push('/applications')
    }
    activate()
  }, [success, sessionId, router])

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  if (success === 'true') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Inter',sans-serif" }}>
        <style>{`@keyframes _spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 22, height: 22, border: '2px solid #333', borderTopColor: '#e8c99a', borderRadius: '50%', animation: '_spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .pw { font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .pw button { font-family: 'DM Sans', system-ui, sans-serif; }
        .pw-sub-btn:hover:not(:disabled) { background: #222 !important; }
        @media (max-width: 640px) {
          .pw-grid { flex-direction: column !important; }
          .pw-left { border-right: none !important; border-bottom: 1px solid #f0f0f0 !important; }
        }
      `}</style>

      <div className="pw" style={{ height: '100dvh', background: '#fff', color: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Nav */}
        <nav style={{ height: 56, borderBottom: '1px solid #f0f0f0', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark />
            <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '-0.02em' }}>reblet</span>
          </div>
          <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#bbb', fontWeight: 500, letterSpacing: '0.03em', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#0a0a0a'}
            onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
          >Log out</button>
        </nav>

        {/* Body - fills remaining space, no scroll */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: 780 }}>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              <span style={{ width: 20, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#bbb' }}>One plan · No limits</span>
              <span style={{ width: 20, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', marginBottom: 10 }}>
              Apply to 700 jobs.<br /><em style={{ fontStyle: 'italic', color: '#bbb' }}>While you sleep.</em>
            </h1>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#999', fontWeight: 300, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px' }}>
              reblet auto-fills and submits LinkedIn Easy Apply forms overnight - so you wake up to interviews.
            </p>

            {/* Card - features left, pricing right */}
            <div style={{ border: '1px solid #ebebeb', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.05)' }}>
              <div className="pw-grid" style={{ display: 'flex' }}>

                {/* Left - features */}
                <div className="pw-left" style={{ flex: 1, padding: '1.5rem 2rem', borderRight: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>What&apos;s included</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {FEATURES.map(label => (
                      <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f5faf5', border: '1px solid #dcf0dc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckIcon />
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: '#0a0a0a', lineHeight: 1.3 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right - pricing */}
                <div style={{ flex: 1, padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fafafa' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 }}>$20</span>
                      <span style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>/month</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#aaa', fontWeight: 300, lineHeight: 1.6 }}>
                      That&apos;s less than 3 cents per application.<br />Cancel anytime - no questions asked.
                    </p>
                  </div>

                  <button
                    className="pw-sub-btn"
                    onClick={handleSubscribe}
                    disabled={loading}
                    style={{ width: '100%', padding: '14px 20px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em', opacity: loading ? 0.6 : 1, transition: 'background 0.15s', marginBottom: 12 }}
                  >
                    {loading ? 'Redirecting to Stripe…' : 'Get started - $20 / month'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: '#ccc', flexShrink: 0 }}>
                      <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '0.03em' }}>Secured by Stripe &nbsp;·&nbsp; 256-bit encrypted</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer style={{ height: 40, borderTop: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.02em' }}>© 2026 reblet &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; No hidden fees</span>
        </footer>

      </div>
    </>
  )
}

export default function PaywallPage() {
  return <Suspense><PaywallContent /></Suspense>
}
