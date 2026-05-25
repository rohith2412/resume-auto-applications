'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FEATURES = [
  'Unlimited AI resume building',
  'AI-powered keyword matching',
  'Resume score & insights',
  'Multiple templates (Classic, Modern, Minimal)',
  'One-click PDF download',
  'Cancel anytime',
]

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="100 85 200 230" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <g transform="translate(200,200)">
        <rect x="-100" y="-115" width="200" height="230" rx="38" fill="#1a1a1a"/>
        <rect x="-22" y="-98" width="44" height="18" rx="6" fill="#666"/>
        <rect x="-22" y="-80" width="44" height="9" rx="2" fill="#999"/>
        <rect x="-22" y="-71" width="44" height="82" rx="4" fill="#ffffff"/>
        <rect x="-22" y="11" width="44" height="14" rx="2" fill="#e8c99a"/>
        <polygon points="-22,25 22,25 0,78" fill="#e8c99a"/>
        <polygon points="-7,64 7,64 0,78" fill="#555"/>
        <line x1="0" y1="76" x2="0" y2="84" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

function PaywallContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (success !== 'true') return
    const interval = setInterval(async () => {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user?.subscriptionActive) { clearInterval(interval); router.push('/my-resumes') }
    }, 2000)
    return () => clearInterval(interval)
  }, [success, router])

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  if (success === 'true') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>
        <div style={{ width: 48, height: 48, background: '#0a0a0a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11l5 5 9-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Payment confirmed</h2>
        <p style={{ color: '#888', fontSize: '14px', fontWeight: 300 }}>Setting up your account...</p>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0e0e0', animation: 'pulse 1.4s ease-in-out ' + (i * 0.2) + 's infinite' }} />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Sans:wght@300;400;500&display=swap');
        .pw-root { font-family: 'DM Sans', 'Inter', sans-serif; -webkit-font-smoothing: antialiased; background: #fff; color: #0a0a0a; }
        .pw-root button { font-family: 'DM Sans', 'Inter', sans-serif; }
      `}</style>
      <div className="pw-root" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>

        <header style={{ borderBottom: '1px solid #e0e0e0', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogoMark />
            <span style={{ fontWeight: 500, fontSize: '14px', letterSpacing: '-0.02em' }}>reblet</span>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>One plan · Everything included</div>
              <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '6px', lineHeight: 1 }}>
                $15<span style={{ fontSize: '1.1rem', fontWeight: 400, color: '#888', fontFamily: "'DM Sans','Inter',sans-serif" }}>/mo</span>
              </h1>
              <p style={{ fontSize: '13px', color: '#888', fontWeight: 300 }}>Everything you need to land more interviews.</p>
            </div>

            <div style={{ border: '1px solid #e0e0e0', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #e0e0e0' }}>
                {FEATURES.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#1a1a1a' }}>
                    <div style={{ width: 18, height: 18, background: '#0a0a0a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  style={{ width: '100%', padding: '13px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, fontFamily: "'DM Sans','Inter',sans-serif", cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}
                >
                  {loading ? 'Redirecting...' : 'Subscribe — $15 / month'}
                </button>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '11.5px', color: '#bbb', lineHeight: 1.65, letterSpacing: '0.02em' }}>
              Secure payment via Stripe &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; No hidden fees
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function PaywallPage() {
  return <Suspense><PaywallContent /></Suspense>
}
