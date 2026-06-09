'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; overflow-x: hidden; }
  .ds, .ds button, .ds input, .ds textarea, .ds select {
    font-family: 'DM Sans', 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .nav-link {
    display: flex; align-items: center; gap: .625rem;
    padding: .5rem .75rem; font-size: .875rem; font-weight: 500;
    border-radius: 6px; cursor: pointer; transition: all .12s;
    background: transparent; border: none; width: 100%; text-align: left;
    color: #888; margin-bottom: 2px; text-decoration: none;
  }
  .nav-link:hover, .nav-link.active { background: #f7f7f5; color: #0a0a0a; }
  .mobile-nav-btn {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: .4rem .5rem; border-radius: 8px; cursor: pointer;
    color: #aaa; font-size: 10px; font-weight: 500; text-decoration: none;
    font-family: 'DM Sans', sans-serif; flex: 1; transition: all .12s;
    -webkit-font-smoothing: antialiased;
  }
  .mobile-nav-btn.active { color: #0a0a0a; }
  .mobile-nav-btn:hover { color: #0a0a0a; background: #f7f7f5; }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade { animation: fade-in .3s ease; }
  .funnel-node {
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .funnel-node:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,.12) !important;
  }
  .edit-input {
    width: 100%; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 8px;
    font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none;
    transition: border-color .12s; -webkit-font-smoothing: antialiased;
    font-weight: 500; color: #0a0a0a; background: #fafaf9;
  }
  .edit-input:focus { border-color: #0a0a0a; background: #fff; }
  .edit-input::-webkit-inner-spin-button, .edit-input::-webkit-outer-spin-button { opacity: 0; }
  .connector-line {
    width: 2px; background: linear-gradient(to bottom, #e0e0e0, #e0e0e0);
    flex-shrink: 0; position: relative;
  }
  .connector-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #d0d0d0;
    position: absolute; left: 50%; transform: translateX(-50%);
  }
`

function BriefcaseIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h2A1.5 1.5 0 0 1 10 3.5V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1.5 9h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function BoltIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="currentColor"><path d="M160-120v-200q0-33 23.5-56.5T240-400h480q33 0 56.5 23.5T800-320v200H160Zm200-320q-83 0-141.5-58.5T160-640q0-83 58.5-141.5T360-840h240q83 0 141.5 58.5T800-640q0 83-58.5 141.5T600-440H360ZM240-200h480v-120H240v120Zm120-320h240q50 0 85-35t35-85q0-50-35-85t-85-35H360q-50 0-85 35t-35 85q0 50 35 85t85 35Zm28.5-91.5Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm240 0Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5ZM480-200Zm0-440Z"/></svg>
}
function UserIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function DiagramIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="5" y="1" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="10.5" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="10.5" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4.5v2.5M7.5 7H3.5v3.5M7.5 7h4v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ArrowDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

const NAV = [
  { id: 'applications', label: 'Applications', href: '/applications', icon: <BriefcaseIcon /> },
  { id: 'auto-apply',   label: 'Auto Apply',   href: '/auto-apply',   icon: <BoltIcon /> },
  { id: 'diagram',      label: 'Diagram',       href: '/diagram',      icon: <DiagramIcon /> },
  { id: 'profile',      label: 'Profile',       href: '/profile',      icon: <UserIcon /> },
]

const DEFAULT_STAGES = [
  {
    id: 'applied',
    label: 'Jobs Applied',
    value: 1000,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: '📋',
    description: 'Total applications sent',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    value: 600,
    color: '#e11d48',
    bg: '#fff1f2',
    border: '#fecdd3',
    icon: '✕',
    description: 'Applications declined',
  },
  {
    id: 'ghosted',
    label: 'Ghosted',
    value: 300,
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fde68a',
    icon: '👻',
    description: 'No response received',
  },
  {
    id: 'interview',
    label: 'Got Interview',
    value: 100,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    icon: '🎙',
    description: 'Landed an interview',
  },
  {
    id: 'offer',
    label: 'Job Offers',
    value: 3,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: '🏆',
    description: 'Received an offer',
  },
]

function pct(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function FunnelNode({ stage, totalApplied, isLast }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* node card */}
      <div
        className="funnel-node"
        style={{
          width: '100%',
          maxWidth: 480,
          background: stage.bg,
          border: `1.5px solid ${stage.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 2px 12px rgba(0,0,0,.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* background bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct(stage.value, totalApplied)}%`,
          background: stage.color,
          opacity: 0.07,
          borderRadius: 14,
          transition: 'width .5s ease',
        }} />

        {/* icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: '#fff',
          border: `1.5px solid ${stage.border}`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>
          {stage.icon}
        </div>

        {/* text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: stage.color, fontWeight: 600, marginBottom: 2, letterSpacing: '.02em' }}>
            {stage.label.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-.03em' }}>
            {stage.value.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
            {stage.id === 'applied'
              ? 'total applications'
              : `${pct(stage.value, totalApplied)}% of applied`
            }
          </div>
        </div>

        {/* rate badge */}
        {stage.id !== 'applied' && (
          <div style={{
            background: '#fff', border: `1px solid ${stage.border}`, borderRadius: 8,
            padding: '4px 10px', fontSize: 12, fontWeight: 600, color: stage.color,
            flexShrink: 0,
          }}>
            {pct(stage.value, totalApplied)}%
          </div>
        )}
      </div>

      {/* connector */}
      {!isLast && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0' }}>
          <div style={{ width: 1.5, height: 20, background: '#ddd' }} />
          <div style={{ color: '#ccc' }}><ArrowDownIcon /></div>
          <div style={{ width: 1.5, height: 8, background: '#ddd' }} />
        </div>
      )}
    </div>
  )
}

function EditPanel({ stages, onChange, onReset }) {
  return (
    <div style={{
      background: '#fafaf9',
      border: '1px solid #e0e0e0',
      borderRadius: 16,
      padding: '20px',
      position: 'sticky',
      top: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#888' }}><EditIcon /></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>Edit Values</span>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'none', border: '1px solid #e0e0e0', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, fontWeight: 500, color: '#888',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.color = '#0a0a0a' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#888' }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stages.map((s, i) => (
          <div key={s.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', letterSpacing: '.01em' }}>
                {s.label}
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="edit-input"
                value={s.value}
                min={0}
                onChange={e => {
                  const v = Math.max(0, parseInt(e.target.value) || 0)
                  onChange(i, v)
                }}
              />
              <div style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 8, borderRadius: '50%', background: s.color, opacity: .7,
              }} />
            </div>
            {i < stages.length - 1 && (
              <div style={{ height: 1, background: '#eee', margin: '12px 0 0' }} />
            )}
          </div>
        ))}
      </div>

      {/* stats summary */}
      <div style={{
        marginTop: 20, padding: 14, background: '#fff',
        border: '1px solid #e8e8e8', borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', marginBottom: 10, letterSpacing: '.06em' }}>
          CONVERSION RATES
        </div>
        {stages.slice(1).map((s, i) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < stages.length - 2 ? 7 : 0 }}>
            <span style={{ fontSize: 11, color: '#888' }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>
              {pct(s.value, stages[0].value)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Shell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogout, setShowLogout] = useState(false)
  const width = useWindowWidth()
  const isMobile = width < 768

  async function doLogout() {
    setShowLogout(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const isActive = href => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="ds" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>

        {!isMobile && (
          <aside style={{
            width: 224, minHeight: '100vh', borderRight: '1px solid #e0e0e0',
            display: 'flex', flexDirection: 'column', position: 'fixed',
            top: 0, left: 0, bottom: 0, background: '#fff', zIndex: 40,
          }}>
            <div style={{ padding: '1.125rem 1rem .875rem', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <img src="/shamrock.svg" width="26" height="26" alt="reblet" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '-.02em' }}>reblet</span>
              </div>
            </div>
            <nav style={{ flex: 1, padding: '.625rem .75rem' }}>
              {NAV.map(n => (
                <Link key={n.id} href={n.href} className={`nav-link${isActive(n.href) ? ' active' : ''}`}>
                  {n.icon}{n.label}
                </Link>
              ))}
            </nav>
            <div style={{ padding: '.875rem', borderTop: '1px solid #e0e0e0' }}>
              <button
                onClick={() => setShowLogout(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#888', padding: '.375rem .5rem', borderRadius: 6, width: '100%', fontFamily: 'inherit', transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f5'; e.currentTarget.style.color = '#0a0a0a' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
              >
                <LogoutIcon /> Log out
              </button>
            </div>
          </aside>
        )}

        {isMobile && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid #e0e0e0',
            padding: '.5rem .25rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          }}>
            {NAV.map(n => (
              <Link key={n.id} href={n.href} className={`mobile-nav-btn${isActive(n.href) ? ' active' : ''}`}>
                {n.icon}<span>{n.label}</span>
              </Link>
            ))}
          </nav>
        )}

        <main style={{
          marginLeft: isMobile ? 0 : 224,
          flex: 1, minHeight: '100vh', minWidth: 0,
          width: isMobile ? '100%' : `calc(100% - 224px)`,
          overflowX: 'hidden',
          paddingBottom: isMobile ? '5rem' : 0,
        }}>
          {children}
        </main>
      </div>

      {showLogout && (
        <div
          onClick={() => setShowLogout(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,.12)', textAlign: 'center', animation: 'fade-in .2s ease' }}
          >
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Log out?</h3>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.75rem' }}>
              You&apos;ll be signed out.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: 11, background: 'transparent', color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={doLogout} style={{ flex: 1, padding: 11, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function DiagramPage() {
  const [stages, setStages] = useState(DEFAULT_STAGES)
  const width = useWindowWidth()
  const isMobile = width < 900

  function handleChange(i, val) {
    setStages(prev => prev.map((s, idx) => idx === i ? { ...s, value: val } : s))
  }

  function handleReset() {
    setStages(DEFAULT_STAGES)
  }

  const totalApplied = stages[0].value

  return (
    <Shell>
      <div className="animate-fade" style={{ padding: isMobile ? '1.5rem 1rem' : '2.5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: isMobile ? '1.6rem' : '2rem',
            fontWeight: 800,
            letterSpacing: '-.04em',
            color: '#0a0a0a',
            lineHeight: 1.1,
            marginBottom: 6,
          }}>
            Job Search Funnel
          </h1>
          <p style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>
            Visualize your application journey from first apply to offer
          </p>
        </div>

        {/* summary bar */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36,
          padding: '16px 20px', background: '#fafaf9', border: '1px solid #e8e8e8',
          borderRadius: 12,
        }}>
          {stages.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 12, color: '#888' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{s.value.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* main layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 260px',
          gap: 28,
          alignItems: 'start',
        }}>
          {/* funnel */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%', maxWidth: 480 }}>
            {stages.map((s, i) => (
              <FunnelNode
                key={s.id}
                stage={s}
                totalApplied={totalApplied}
                isLast={i === stages.length - 1}
              />
            ))}

            {/* success rate footer */}
            <div style={{
              marginTop: 24, padding: '14px 24px',
              background: '#f0fdf4', border: '1.5px solid #bbf7d0',
              borderRadius: 12, textAlign: 'center',
              display: 'flex', gap: 24, alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 2, letterSpacing: '.04em' }}>OFFER RATE</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.03em' }}>
                  {totalApplied ? ((stages[4].value / totalApplied) * 100).toFixed(2) : '0.00'}%
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: '#bbf7d0' }} />
              <div>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 2, letterSpacing: '.04em' }}>INTERVIEW RATE</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.03em' }}>
                  {totalApplied ? ((stages[3].value / totalApplied) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: '#bbf7d0' }} />
              <div>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 2, letterSpacing: '.04em' }}>RESPONSE RATE</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.03em' }}>
                  {totalApplied ? (((totalApplied - stages[1].value - stages[2].value) / totalApplied) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
          </div>

          {/* edit panel */}
          <EditPanel stages={stages} onChange={handleChange} onReset={handleReset} />
        </div>
      </div>
    </Shell>
  )
}
