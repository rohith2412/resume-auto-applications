'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FEATURES = [
  { label: '700 LinkedIn Easy Apply submissions / month', sub: 'Extension runs automatically while you sleep' },
  { label: 'AI fills every screening question', sub: 'Tailored answers based on your profile' },
  { label: 'Application tracking dashboard', sub: 'See every job applied to in one place' },
  { label: 'Chrome extension — set up once', sub: 'Works on any LinkedIn job listing' },
  { label: 'Profile-based personalisation', sub: 'Your experience, your voice' },
]

const STATS = [
  { value: '700', label: 'applications / mo' },
  { value: '$0.03', label: 'per application' },
  { value: '24/7', label: 'runs overnight' },
]

function LogoMark() {
  return (
    <img src="/shamrock.svg" width="26" height="26" alt="reblet" style={{ flexShrink: 0 }} />
  )
}

const CMP_ROWS = [
  { label: 'Monthly price',           others: '$20–$40+', reblet: '$20'  },
  { label: 'Applications / month',    others: '~150',     reblet: '700'  },
  { label: 'AI fills screening Qs',   others: false,      reblet: true   },
  { label: 'LinkedIn Easy Apply',     others: true,       reblet: true   },
  { label: 'Application tracking',    others: false,      reblet: true   },
  { label: 'Runs overnight (async)',  others: false,      reblet: true   },
  { label: 'Cancel anytime',          others: true,       reblet: true   },
]

const COLS = [
  { key: 'others', label: 'Others', highlight: false },
  { key: 'reblet', label: 'reblet', highlight: true  },
]

function CmpCell({ val, highlight }) {
  if (val === true)  return <span style={{ color: highlight ? '#16a34a' : '#22c55e', fontSize: 16, lineHeight: 1 }}>✓</span>
  if (val === false) return <span style={{ color: '#e0e0e0', fontSize: 16, lineHeight: 1 }}>✕</span>
  return <span style={{ fontSize: 12.5, fontWeight: highlight ? 700 : 500, color: highlight ? '#0a0a0a' : '#555' }}>{val}</span>
}

function ComparisonTable() {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
        <span style={{ width: 20, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#bbb' }}>How we compare</span>
        <span style={{ width: 20, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #ebebeb', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0', background: '#fafafa', minWidth: 170 }}>Feature</th>
              {COLS.map(({ key, label, highlight }) => (
                <th key={key} style={{
                  padding: '14px 20px', textAlign: 'center',
                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                  borderBottom: `2px solid ${highlight ? '#0a0a0a' : '#f0f0f0'}`,
                  background: highlight ? '#0a0a0a' : '#fafafa',
                  color: highlight ? '#fff' : '#aaa',
                  minWidth: 100,
                }}>
                  {highlight && <span style={{ display: 'block', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8c99a', marginBottom: 2 }}>YOU ARE HERE</span>}
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CMP_ROWS.map(({ label, ...vals }, i) => (
              <tr key={label} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 500, color: '#555', borderBottom: '1px solid #f5f5f5' }}>{label}</td>
                {COLS.map(({ key, highlight }) => (
                  <td key={key} style={{
                    padding: '13px 20px', textAlign: 'center',
                    borderBottom: '1px solid #f5f5f5',
                    background: highlight ? (i % 2 === 0 ? '#f5f5f0' : '#f0f0eb') : 'transparent',
                    borderLeft: highlight ? '1px solid #e8e8e0' : 'none',
                    borderRight: highlight ? '1px solid #e8e8e0' : 'none',
                  }}>
                    <CmpCell val={vals[key]} highlight={highlight} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      router.push('/my-resumes')
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

  // ── Post-payment: just show a spinner while verify + redirect runs ──
  if (success === 'true') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Inter',sans-serif" }}>
        <style>{`@keyframes _spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 22, height: 22, border: '2px solid #333', borderTopColor: '#e8c99a', borderRadius: '50%', animation: '_spin 0.7s linear infinite' }} />
      </div>
    )
  }

  // ── Main paywall ───────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .pw { font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .pw button { font-family: 'DM Sans', system-ui, sans-serif; }
        .pw-sub-btn:hover:not(:disabled) { background: #222 !important; }
        @media (max-width: 640px) {
          .pw-grid { grid-template-columns: 1fr !important; }
          .pw-left { border-right: none !important; border-bottom: 1px solid #f0f0f0 !important; padding-bottom: 2rem !important; }
          .pw-stats { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .pw-stats { grid-template-columns: 1fr !important; gap: 1px !important; }
        }
      `}</style>

      <div className="pw" style={{ minHeight: '100vh', background: '#fff', color: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>

        {/* Nav */}
        <nav style={{ height: 58, borderBottom: '1px solid #f0f0f0', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark />
            <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '-0.02em' }}>reblet</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#bbb', letterSpacing: '0.03em' }}>UPGRADE</span>
            <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#bbb', fontWeight: 500, letterSpacing: '0.03em', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#0a0a0a'}
              onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
            >Log out</button>
          </div>
        </nav>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ width: '100%', maxWidth: 820 }}>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
              <span style={{ width: 20, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#bbb' }}>One plan · No limits</span>
              <span style={{ width: 20, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, textAlign: 'center', marginBottom: 14 }}>
              Apply to 700 jobs.<br /><em style={{ fontStyle: 'italic', color: '#bbb' }}>While you sleep.</em>
            </h1>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#999', fontWeight: 300, lineHeight: 1.6, marginBottom: 40, maxWidth: 380, margin: '0 auto 40px' }}>
              reblet auto-fills and submits LinkedIn Easy Apply forms overnight — so you wake up to interviews.
            </p>

            {/* Stats strip */}
            <div className="pw-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#f0f0f0', borderRadius: 14, overflow: 'hidden', marginBottom: 32 }}>
              {STATS.map(({ value, label }) => (
                <div key={label} style={{ background: '#fff', padding: '18px 20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginTop: 4, letterSpacing: '0.02em' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <ComparisonTable />

            {/* Card */}
            <div style={{ border: '1px solid #ebebeb', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.05)' }}>

              <div className="pw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

                {/* Left — features */}
                <div className="pw-left" style={{ padding: '2rem', borderRight: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>What&apos;s included</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {FEATURES.map(({ label, sub }) => (
                      <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f5faf5', border: '1px solid #dcf0dc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <CheckIcon />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0a0a0a', lineHeight: 1.3 }}>{label}</div>
                          <div style={{ fontSize: 11.5, color: '#bbb', marginTop: 2, fontWeight: 300 }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — pricing */}
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fafafa' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Pricing</div>

                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(2.4rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 }}>$20</span>
                      <span style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>/month</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#aaa', fontWeight: 300, lineHeight: 1.6 }}>
                      That&apos;s less than 3 cents per application.<br />Cancel anytime — no questions asked.
                    </p>
                  </div>

                  <button
                    className="pw-sub-btn"
                    onClick={handleSubscribe}
                    disabled={loading}
                    style={{ width: '100%', padding: '14px 20px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em', opacity: loading ? 0.6 : 1, transition: 'background 0.15s', marginBottom: 14 }}
                  >
                    {loading ? 'Redirecting to Stripe…' : 'Get started — $20 / month'}
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
        <footer style={{ height: 44, borderTop: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.02em' }}>© 2026 reblet &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; No hidden fees</span>
        </footer>

      </div>
    </>
  )
}

export default function PaywallPage() {
  return <Suspense><PaywallContent /></Suspense>
}
