"use client"
import { useState, useEffect } from "react"

// ── Live notification toasts ──────────────────────────────────
const NOTIFS = [
  { name: 'Thomas K.',  photo: 'https://i.pravatar.cc/150?img=12', msg: 'Interview call from Meta 🎉',      },
  { name: 'Sarah M.',   photo: 'https://i.pravatar.cc/150?img=5',  msg: 'Applied to 89 jobs overnight 🚀', },
  { name: 'James L.',   photo: 'https://i.pravatar.cc/150?img=33', msg: 'Interview landed at Google 📞',   },
  { name: 'Emily R.',   photo: 'https://i.pravatar.cc/150?img=47', msg: 'Callback from Amazon ✅',         },
  { name: 'David C.',   photo: 'https://i.pravatar.cc/150?img=68', msg: '120 applications sent tonight 🌙',},
  { name: 'Priya S.',   photo: 'https://i.pravatar.cc/150?img=44', msg: 'Interview offer from Stripe 🎯',  },
]

// Positions within the hero div — beside / above the headline, not over CTAs
const L_TOPS = ['14%', '36%', '58%']
const R_TOPS = ['20%', '42%', '62%']

function NotifPill({ side, startIdx, initialDelay }) {
  const [idx,    setIdx]    = useState(startIdx % NOTIFS.length)
  const [phase,  setPhase]  = useState('hidden')
  const [topIdx, setTopIdx] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhase('in'), initialDelay)
    return () => clearTimeout(t)
  }, [initialDelay])

  useEffect(() => {
    if (phase === 'hidden') return
    const map  = { in: 380, hold: 3200, out: 300 }
    const next = { in: 'hold', hold: 'out', out: 'hidden' }
    const t = setTimeout(() => {
      if (phase === 'out') {
        setIdx(i => (i + 2) % NOTIFS.length)
        setTopIdx(i => (i + 1) % (side === 'left' ? L_TOPS.length : R_TOPS.length))
        setTimeout(() => setPhase('in'), 650)
      } else {
        setPhase(next[phase])
      }
    }, map[phase])
    return () => clearTimeout(t)
  }, [phase, side])

  if (phase === 'hidden') return null

  const n      = NOTIFS[idx]
  const tops   = side === 'left' ? L_TOPS : R_TOPS
  const pos    = side === 'left' ? { left: '3%' } : { right: '3%' }
  const animIn  = side === 'left'
    ? 'pill-in-l 0.44s cubic-bezier(0.34,1.4,0.64,1) forwards'
    : 'pill-in-r 0.44s cubic-bezier(0.34,1.4,0.64,1) forwards'
  const animOut = side === 'left'
    ? 'pill-out-l 0.26s ease forwards'
    : 'pill-out-r 0.26s ease forwards'

  return (
    <div style={{
      position: 'absolute',
      top: tops[topIdx],
      ...pos,
      zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 9,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 99,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
      padding: '5px 12px 5px 5px',
      maxWidth: 210,
      animation: phase === 'out' ? animOut : animIn,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      <img src={n.photo} alt={n.name} width={26} height={26}
        style={{ borderRadius: '50%', display: 'block', objectFit: 'cover', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#111', letterSpacing: '-0.01em' }}>{n.name}</div>
        <div style={{ fontSize: 10, color: '#777', fontWeight: 400, marginTop: 1 }}>{n.msg}</div>
      </div>
    </div>
  )
}

function NotifToasts() {
  return (
    <>
      <NotifPill side="left"  startIdx={0} initialDelay={1400} />
      <NotifPill side="right" startIdx={3} initialDelay={3200} />
    </>
  )
}

// ── Auth Modal (unchanged) ────────────────────────────────────
function AuthModal({ onClose, initialMode }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return }
      if (mode === "login") {
        if (!data.subscriptionActive) window.location.href = "/paywall"
        else window.location.href = "/my-resumes"
      } else {
        window.location.href = "/paywall"
      }
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  function switchMode() { setMode(m => m === "login" ? "signup" : "login"); setError("") }

  return (
    <>
      <style>{`@keyframes _qrspin { to { transform: rotate(360deg); } } ._qrspinner { width:16px;height:16px;border:2px solid #0a0a0a;border-top-color:transparent;border-radius:50%;animation:_qrspin 0.7s linear infinite;display:inline-block; }`}</style>
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"'DM Sans','Inter',sans-serif" }}
      >
        <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"420px", background:"#111", borderRadius:"20px", border:"1px solid #2a2a2a", overflow:"hidden" }}>

          <div style={{ padding:"2rem 2rem 1.5rem", borderBottom:"1px solid #1e1e1e" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"1.75rem" }}>
              <svg width="26" height="26" viewBox="100 85 200 230" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
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
              <span style={{ fontSize:12, fontWeight:500, color:"#555", letterSpacing:"0.04em" }}>reblet</span>
              <button onClick={onClose} aria-label="Close" style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#555", fontSize:22, lineHeight:1, display:"flex", alignItems:"center", padding:2 }}>&times;</button>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"1.6rem", fontWeight:800, color:"#f5f5f0", letterSpacing:"-0.03em", lineHeight:1.15, margin:"0 0 6px" }}>
              {mode === "login" ? <>Welcome <em style={{ fontStyle:"italic", color:"#888" }}>back.</em></> : <>Create an <em style={{ fontStyle:"italic", color:"#888" }}>account.</em></>}
            </h2>
            <p style={{ fontSize:13, color:"#555", fontWeight:300, margin:0 }}>
              {mode === "login" ? "Log in to continue." : "Start applying automatically today."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding:"1.75rem 2rem 2rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <span style={{ fontSize:11, fontWeight:500, color:"#444", letterSpacing:"0.1em", textTransform:"uppercase" }}>Email</span>
              <input type="email" required autoFocus placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", background:"#0a0a0a", border:"1px solid #222", borderRadius:10, padding:"11px 14px", fontSize:13.5, fontFamily:"'DM Sans','Inter',sans-serif", color:"#f0f0f0", outline:"none" }} />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <span style={{ fontSize:11, fontWeight:500, color:"#444", letterSpacing:"0.1em", textTransform:"uppercase" }}>Password</span>
              <div style={{ position:"relative" }}>
                <input type={showPw ? "text" : "password"} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} minLength={mode === "signup" ? 8 : 1}
                  style={{ width:"100%", boxSizing:"border-box", background:"#0a0a0a", border:"1px solid #222", borderRadius:10, padding:"11px 2.75rem 11px 14px", fontSize:13.5, fontFamily:"'DM Sans','Inter',sans-serif", color:"#f0f0f0", outline:"none" }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#555", display:"flex", alignItems:"center", padding:0 }}>
                  {showPw
                    ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && <div style={{ background:"#1a0a0a", border:"1px solid #3a1414", borderRadius:8, padding:"10px 13px", fontSize:13, color:"#c0504a" }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:13, background:"#f5f5f0", color:"#0a0a0a", border:"none", borderRadius:10, fontSize:13.5, fontWeight:500, fontFamily:"'DM Sans','Inter',sans-serif", cursor:loading ? "not-allowed" : "pointer", letterSpacing:"-0.01em", display:"flex", alignItems:"center", justifyContent:"center", opacity:loading ? 0.5 : 1 }}>
              {loading ? <span className="_qrspinner" /> : mode === "login" ? "Log in" : "Create account"}
            </button>

            <div style={{ textAlign:"center", fontSize:12.5, color:"#444", paddingTop:"0.25rem" }}>
              <span>{mode === "login" ? "Don't have an account? " : "Already have an account? "}</span>
              <button type="button" onClick={switchMode}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#888", fontFamily:"'DM Sans','Inter',sans-serif", fontSize:12.5, fontWeight:500, textDecoration:"underline", textUnderlineOffset:2, padding:0 }}>
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </div>
          </form>

          <div style={{ padding:"1rem 2rem", borderTop:"1px solid #191919", display:"flex", alignItems:"center", gap:8 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color:"#383838", flexShrink:0 }}>
              <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize:11, color:"#383838", letterSpacing:"0.03em" }}>256-bit encrypted &nbsp;&middot;&nbsp; Cancel anytime</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Landing page ──────────────────────────────────────────────
export default function BlurredPreview() {
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("signup")

  function open(mode) { setModalMode(mode); setShowModal(true) }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;1,800;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        .lp { font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .lp-btn { font-family: 'DM Sans', system-ui, sans-serif; cursor: pointer; border: none; transition: all 0.15s; letter-spacing: -0.01em; }
        @keyframes pill-in-l  { from { opacity:0; transform:translateX(-110%) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes pill-out-l { from { opacity:1; transform:translateX(0) scale(1); } to { opacity:0; transform:translateX(-110%) scale(0.9); } }
        @keyframes pill-in-r  { from { opacity:0; transform:translateX(110%) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes pill-out-r { from { opacity:1; transform:translateX(0) scale(1); } to { opacity:0; transform:translateX(110%) scale(0.9); } }

        /* ── Responsive ── */
        @media (max-width: 560px) {
          .lp-nav  { padding: 0 1.1rem !important; height: 52px !important; }
          .lp-hero { padding: 0 1.1rem !important; }
          .lp-label { margin-bottom: 14px !important; }
          .lp-hero h1 { font-size: clamp(2rem, 9vw, 2.6rem) !important; margin-bottom: 14px !important; }
          .lp-hero p  { font-size: 13px !important; max-width: 100% !important; margin-bottom: 22px !important; }
          .lp-pill { flex-direction: column !important; align-self: stretch !important; border-radius: 14px !important; margin-bottom: 22px !important; }
          .lp-pill > div { justify-content: center !important; }
          .lp-ctas { flex-direction: column !important; align-items: stretch !important; width: 100% !important; max-width: 340px !important; }
          .lp-ctas .lp-btn { width: 100% !important; padding: 13px 20px !important; }
          .lp-footer { height: auto !important; padding: 10px 1rem !important; }
          .lp-footer span { font-size: 10px !important; line-height: 1.7 !important; }
        }
      `}</style>

      <div className="lp" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', color: '#0a0a0a' }}>

        {/* Nav */}
        <nav className="lp-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: 60, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <svg width="24" height="24" viewBox="100 85 200 230" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
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
            <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '-0.02em' }}>reblet</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="lp-btn" onClick={() => open("login")}
              style={{ padding: '8px 18px', background: 'transparent', color: '#555', fontSize: 13, fontWeight: 500, borderRadius: 8, border: '1px solid #e8e8e8' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ccc'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e8e8'}>
              Log in
            </button>
            <button className="lp-btn" onClick={() => open("signup")}
              style={{ padding: '8px 18px', background: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 500, borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = '#333'}
              onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}>
              Get started
            </button>
          </div>
        </nav>

        {/* Hero — vertically centered */}
        <div className="lp-hero" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <NotifToasts />

          {/* Label */}
          <div className="lp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
             Auto Apply
            <span style={{ width: 24, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 22, maxWidth: 700 }}>
            Apply to hundreds<br />of jobs <em style={{ fontStyle: 'italic', color: '#aaa' }}>overnight.</em>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: '#888', fontWeight: 300, lineHeight: 1.7, maxWidth: 420, marginBottom: 44 }}>
            reblet's Chrome extension auto-fills and submits LinkedIn Easy Apply forms while you focus on what matters.
          </p>

          {/* Pricing pill */}
          <div className="lp-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 0, marginBottom: 36, border: '1px solid #e8e8e8', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ padding: '10px 22px', background: '#0a0a0a', color: '#fff' }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em' }}>$20</span>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#888', marginLeft: 4 }}>/month</span>
            </div>
            <div style={{ padding: '10px 22px', background: '#fff', color: '#555' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>700 auto-applications / month</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="lp-ctas" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lp-btn" onClick={() => open("signup")}
              style={{ padding: '13px 32px', background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#333'}
              onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}>
              Get started →
            </button>
            <button className="lp-btn" onClick={() => open("login")}
              style={{ padding: '13px 32px', background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500, borderRadius: 10, border: '1px solid #e8e8e8' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#555' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.color = '#888' }}>
              Log in
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32 }}>
            {/* Overlapping avatars */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                'https://i.pravatar.cc/150?img=5',
                'https://i.pravatar.cc/150?img=12',
                'https://i.pravatar.cc/150?img=44',
                'https://i.pravatar.cc/150?img=33',
              ].map((src, i) => (
                <img key={src} src={src} alt="user" width={32} height={32}
                  style={{
                    borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid #fff',
                    marginLeft: i === 0 ? 0 : -10,
                    zIndex: 4 - i, position: 'relative',
                    display: 'block',
                  }} />
              ))}
            </div>
            {/* Stars + text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="13" height="13" viewBox="0 0 16 16" fill="#f59e0b">
                    <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/>
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: '#aaa', fontWeight: 400 }}>Loved by <strong style={{ color: '#555', fontWeight: 600 }}>150,000+</strong> job seekers</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="lp-footer" style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, color: '#ccc', letterSpacing: '0.02em' }}>No card required to start &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Secure checkout via Stripe</span>
        </footer>

      </div>

      {showModal && <AuthModal onClose={() => setShowModal(false)} initialMode={modalMode} />}
    </>
  )
}
