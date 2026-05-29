"use client"
import { useState, useEffect } from "react"

// ── Live notification toasts ──────────────────────────────────
const NOTIFS = [
  { name: 'Thomas K.',  photo: 'https://i.pravatar.cc/150?img=12', msg: 'Interview call from Meta 🎉'         },
  { name: 'Sarah M.',   photo: 'https://i.pravatar.cc/150?img=5',  msg: 'Applied to 89 jobs overnight 🎊'    },
  { name: 'James L.',   photo: 'https://i.pravatar.cc/150?img=33', msg: 'Interview landed at Google 🎖️'      },
  { name: 'Emily R.',   photo: 'https://i.pravatar.cc/150?img=47', msg: 'Callback from Amazon 🏆'            },
  { name: 'David C.',   photo: 'https://i.pravatar.cc/150?img=68', msg: '120 applications sent tonight ⭐️'  },
  { name: 'Priya S.',   photo: 'https://i.pravatar.cc/150?img=44', msg: 'Interview offer from Stripe 🎯'     },
  { name: 'Aiden W.',   photo: 'https://i.pravatar.cc/150?img=3',  msg: 'Hired at Apple - thank you! 🍎'     },
  { name: 'Mia T.',     photo: 'https://i.pravatar.cc/150?img=9',  msg: '200 apps sent while I slept 🌼'     },
  { name: 'Noah B.',    photo: 'https://i.pravatar.cc/150?img=15', msg: 'Offer letter from Netflix ❄️'       },
  { name: 'Chloe F.',   photo: 'https://i.pravatar.cc/150?img=20', msg: 'Recruiter reached out from X 🍀'   },
  { name: 'Liam H.',    photo: 'https://i.pravatar.cc/150?img=25', msg: 'First interview in 2 days 👑'       },
  { name: 'Zoe A.',     photo: 'https://i.pravatar.cc/150?img=29', msg: 'Applied to 300 roles this week 🌱'  },
  { name: 'Ethan J.',   photo: 'https://i.pravatar.cc/150?img=35', msg: 'Got a call from Shopify 🛍️'        },
  { name: 'Ava N.',     photo: 'https://i.pravatar.cc/150?img=39', msg: 'Resume shortlisted at Tesla 🌝'     },
  { name: 'Mason P.',   photo: 'https://i.pravatar.cc/150?img=52', msg: '3 interviews booked this morning ☀️'},
  { name: 'Isabelle D.',photo: 'https://i.pravatar.cc/150?img=56', msg: 'Callback from Airbnb 🌏'           },
  { name: 'Lucas R.',   photo: 'https://i.pravatar.cc/150?img=60', msg: 'Landed a role at OpenAI 🪐'        },
  { name: 'Grace O.',   photo: 'https://i.pravatar.cc/150?img=64', msg: 'LinkedIn recruiter messaged me ⛅️'  },
  { name: 'Ryan V.',    photo: 'https://i.pravatar.cc/150?img=7',  msg: '500 applications - zero effort 🍓'  },
  { name: 'Nina K.',    photo: 'https://i.pravatar.cc/150?img=16', msg: 'Interview scheduled at Uber 🍎'     },
  { name: 'Oscar M.',   photo: 'https://i.pravatar.cc/150?img=22', msg: 'Job offer accepted today 🥂'        },
  { name: 'Lily Q.',    photo: 'https://i.pravatar.cc/150?img=48', msg: 'Screening call from Microsoft 🎖️'   },
  { name: 'Finn S.',    photo: 'https://i.pravatar.cc/150?img=57', msg: '150 easy applies while I ate lunch 🎀'},
  { name: 'Arjun T.',   photo: 'https://i.pravatar.cc/150?img=61', msg: 'Offer from Salesforce signed 🦁'    },
]

// Notification pill — fades in, holds, fades out slowly, then next person
function StaticPill({ notifStart, delay }) {
  const [idx,   setIdx]   = useState(notifStart % NOTIFS.length)
  const [phase, setPhase] = useState('hidden')

  useEffect(() => {
    const t = setTimeout(() => setPhase('in'), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (phase === 'hidden') return
    const dur = { in: 450, hold: 3200, out: 1400 }
    const t = setTimeout(() => {
      if (phase === 'out') {
        setIdx(i => (i + 1) % NOTIFS.length)
        setTimeout(() => setPhase('in'), 500)
      } else {
        setPhase({ in: 'hold', hold: 'out' }[phase])
      }
    }, dur[phase])
    return () => clearTimeout(t)
  }, [phase])

  const n = NOTIFS[idx]
  const anim =
    phase === 'in'   ? 'sp-in  0.45s ease forwards' :
    phase === 'out'  ? 'sp-out 1.4s  ease forwards' : 'none'

  if (phase === 'hidden') return null

  return (
    <span className="sp-outer" style={{ display: 'inline-block' }}>
    <div className="sp-pill" style={{
      zIndex: 20, pointerEvents: 'none',
      display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
      background: 'rgba(255,255,255,0.93)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderRadius: 99,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 3px 16px rgba(0,0,0,0.07)',
      padding: '5px 12px 5px 5px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: '13px',
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 'normal',
      lineHeight: 'normal',
      textAlign: 'left',
      whiteSpace: 'nowrap',
      animation: anim,
    }}>
      <img src={n.photo} alt={n.name} width={28} height={28}
        style={{ borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{n.name}</div>
        <div style={{ fontSize: 10.5, color: '#777', fontWeight: 400, marginTop: 1 }}>{n.msg}</div>
      </div>
    </div>
    </span>
  )
}

function NotifFloat() {
  return (
    <>
      {/* top-right — over "hundreds" */}
      <StaticPill top="20%" right="5%"                               notifStart={0} delay={800}  />
      {/* mid-left — peeks in beside "of jobs" */}
      <StaticPill top="38%" left="-52px"                             notifStart={2} delay={1600} />
      {/* mid-right — peeks in beside "overnight" */}
      <StaticPill top="44%" right="-52px"                            notifStart={4} delay={2400} />
      {/* lower-center — over subtitle */}
      <StaticPill top="63%" left="50%" transform="translateX(-50%)"  notifStart={1} delay={1200} />
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
        else window.location.href = "/applications"
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
              <img src="/shamrock.svg" width="22" height="22" alt="reblet" style={{ flexShrink: 0, filter: 'invert(1)' }} />
              <span style={{ fontSize:12, fontWeight:500, color:"#fff", letterSpacing:"0.04em" }}>reblet</span>
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
        @keyframes sp-in  { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
        @keyframes sp-out { from { opacity:1; } to { opacity:0; } }

        /* ── Responsive ── */
        @media (max-width: 560px) {
          /* Nav */
          .lp-nav { padding: 0 1rem !important; height: 50px !important; }

          /* Hero */
          .lp-hero { padding: 0 1rem !important; overflow: hidden; justify-content: flex-start !important; padding-top: 18px !important; }

          /* Label */
          .lp-label { margin-bottom: 10px !important; font-size: 9px !important; }

          /* Headline — give room above/below for pills */
          .lp-hero h1 { font-size: clamp(1.9rem, 9vw, 2.4rem) !important; margin-top: 52px !important; margin-bottom: 52px !important; position: relative !important; line-height: 1.08 !important; }
          .sp-word { position: static !important; }

          /* Subtitle */
          .lp-hero p { font-size: 12.5px !important; max-width: 100% !important; margin-bottom: 16px !important; line-height: 1.55 !important; }

          /* Pricing pill — stay horizontal, compact */
          .lp-pill { margin-bottom: 16px !important; }
          .lp-pill > div:first-child { padding: 8px 14px !important; }
          .lp-pill > div:last-child  { padding: 8px 14px !important; }
          .lp-pill > div:last-child span { font-size: 11.5px !important; }

          /* CTAs */
          .lp-ctas { flex-direction: column !important; align-items: stretch !important; width: 100% !important; gap: 8px !important; }
          .lp-ctas .lp-btn { width: 100% !important; padding: 12px 20px !important; font-size: 13.5px !important; }

          /* Footer */
          .lp-footer { height: auto !important; padding: 8px 1rem !important; }
          .lp-footer span { font-size: 9.5px !important; line-height: 1.6 !important; }

          /* Notification pills */
          .sp-outer { display: inline-block; }
          .sp-pill { max-width: 165px !important; padding: 3px 8px 3px 3px !important; gap: 4px !important; }
          .sp-pill img { width: 20px !important; height: 20px !important; }
          .sp-pill > div > div:first-child { font-size: 8.5px !important; white-space: nowrap; }
          .sp-pill > div > div:last-child  { font-size: 7.5px !important; white-space: nowrap; }

          /* Pill positions — scattered around headline */
          .sp-h-1 { position: absolute !important; top: -50px !important; left: 2px !important; bottom: auto !important; right: auto !important; transform: none !important; margin: 0 !important; }
          .sp-h-2 { position: absolute !important; top: -28px !important; right: 2px !important; left: auto !important; bottom: auto !important; transform: none !important; margin: 0 !important; }
          .sp-h-3 { position: absolute !important; bottom: -28px !important; left: 2px !important; top: auto !important; right: auto !important; transform: none !important; margin: 0 !important; }
          .sp-h-4 { position: absolute !important; bottom: -50px !important; right: 2px !important; top: auto !important; left: auto !important; transform: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="lp" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', color: '#0a0a0a' }}>

        {/* Nav */}
        <nav className="lp-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: 60, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/shamrock.svg" width="24" height="24" alt="reblet" style={{ flexShrink: 0 }} />
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

        {/* Hero — vertically centered position: 'absolute', top: '50%', right: '105%', transform: 'translateY(-50%)', marginRight: 6 */} 
        <div className="lp-hero" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem', textAlign: 'center' }}>

          {/* Label */}
          <div className="lp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
             Auto Apply
            <span style={{ width: 24, height: 1, background: '#e0e0e0', display: 'inline-block' }} />
          </div>

          {/* Headline */}
          <h1 className="lp-h1" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 22, maxWidth: 700 }}>
            {/* holder left of "Apply" */}
            <span className="sp-word" style={{ position: 'relative', display: 'inline-block' }}>
              Apply
              <span className="sp-h sp-h-1" style={{ position: 'absolute', top: '50%', right: '80%', transform: 'translateY(-50%)', marginRight: 6 }}>
                <StaticPill notifStart={3} delay={2600} />
              </span>
            </span>
            {' '}to{' '}
            {/* holder above "hundreds" */}
            <span className="sp-word" style={{ position: 'relative', display: 'inline-block' }}>
              hundreds
              <span className="sp-h sp-h-2" style={{ position: 'absolute', bottom: '50%', right: 0, marginBottom: 5 }}>
                <StaticPill notifStart={0} delay={800} />
              </span>
            </span>
            <br />
            {/* holder left of "of jobs" */}
            <span className="sp-word" style={{ position: 'relative', display: 'inline-block' }}>
              of jobs
              <span className="sp-h sp-h-3" style={{ position: 'absolute', top: '70%', right: '50%', transform: 'translateY(-50%)', marginRight: 6 }}>
                <StaticPill notifStart={2} delay={1800} />
              </span>
            </span>
            {' '}
            {/* holder right of "overnight" */}
            <span className="sp-word" style={{ position: 'relative', display: 'inline-block' }}>
              <em style={{ fontStyle: 'italic', color: '#aaa' }}>overnight.</em>
              <span className="sp-h sp-h-4" style={{ position: 'absolute', top: '50%', left: '80%', transform: 'translateY(-50%)', marginLeft: 6 }}>
                <StaticPill notifStart={4} delay={3400} />
              </span>
            </span>
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
