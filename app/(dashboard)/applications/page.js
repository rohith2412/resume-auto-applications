'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// ─── global styles ────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; overflow-x: hidden; }
  .ds { overflow-x: hidden; }
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
  .toast-wrap {
    position: fixed; right: 1rem; z-index: 999;
    display: flex; flex-direction: column; gap: .5rem; align-items: flex-end;
  }
  .toast {
    padding: .625rem 1rem; border-radius: 8px; font-size: 13px; font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,.12); animation: toast-in .2s ease;
    font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased;
  }
  .toast-success { background: #0a0a0a; color: #fff; }
  .toast-error   { background: #dc2626; color: #fff; }
  .toast-info    { background: #2563eb; color: #fff; }
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(8px) scale(.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-fade { animation: fade-in .25s ease; }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .loading-dots { display: flex; gap: 5px; align-items: center; }
  .loading-dots span {
    width: 6px; height: 6px; border-radius: 50%; background: currentColor;
    animation: dot-bounce .9s ease-in-out infinite;
  }
  .loading-dots span:nth-child(2) { animation-delay: .15s; }
  .loading-dots span:nth-child(3) { animation-delay: .3s; }
  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(.7); opacity: .5; }
    40%           { transform: scale(1);  opacity: 1; }
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
`

// ─── icons ────────────────────────────────────────────────────
function BriefcaseIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h2A1.5 1.5 0 0 1 10 3.5V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1.5 9h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function BoltIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="currentColor"><path d="M160-120v-200q0-33 23.5-56.5T240-400h480q33 0 56.5 23.5T800-320v200H160Zm200-320q-83 0-141.5-58.5T160-640q0-83 58.5-141.5T360-840h240q83 0 141.5 58.5T800-640q0 83-58.5 141.5T600-440H360ZM240-200h480v-120H240v120Zm120-320h240q50 0 85-35t35-85q0-50-35-85t-85-35H360q-50 0-85 35t-35 85q0 50 35 85t85 35Zm28.5-91.5Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm240 0Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5ZM480-200Zm0-440Z"/></svg>
}
function UserIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10M4.5 3.5V2h4v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3.5l-.75 7.5h-5.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

// ─── config ───────────────────────────────────────────────────
const NAV = [
  { id: 'applications', label: 'Applications', href: '/applications', icon: <BriefcaseIcon /> },
  { id: 'auto-apply',   label: 'Auto Apply',   href: '/auto-apply',   icon: <BoltIcon /> },
  { id: 'profile',      label: 'Profile',      href: '/profile',      icon: <UserIcon /> },
]
const STATUS_LABELS = { applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' }
const STATUS_COLORS = {
  applied:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  interview: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  offer:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:  { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
}

// ─── useWindowWidth hook ──────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// ─── shell ────────────────────────────────────────────────────
function Shell({ user, toasts, children }) {
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

        {/* ── Desktop Sidebar ── */}
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
              <div style={{ fontSize: '.75rem', color: '#bbb', marginBottom: '.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 .25rem' }}>
                {user.email}
              </div>
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

        {/* ── Mobile Bottom Nav ── */}
        {isMobile && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid #e0e0e0',
            padding: '.5rem .25rem',
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          }}>
            {NAV.map(n => (
              <Link key={n.id} href={n.href} className={`mobile-nav-btn${isActive(n.href) ? ' active' : ''}`}>
                {n.icon}
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* ── Main ── */}
        <main style={{
          marginLeft: isMobile ? 0 : 224,
          flex: 1,
          minHeight: '100vh',
          minWidth: 0,
          width: isMobile ? '100%' : `calc(100% - 224px)`,
          overflowX: 'hidden',
          paddingBottom: isMobile ? '5rem' : 0,
        }}>
          {children}
        </main>
      </div>

      {/* ── Logout modal ── */}
      {showLogout && (
        <div
          onClick={() => setShowLogout(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,.12)', textAlign: 'center', animation: 'fade-in .2s ease' }}
          >
            <div style={{ width: 44, height: 44, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <LogoutIcon />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Log out?</h3>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.75rem' }}>
              You&apos;ll be signed out. Any unsaved changes will be lost.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{ flex: 1, padding: 11, background: 'transparent', color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
              >Cancel</button>
              <button
                onClick={doLogout}
                style={{ flex: 1, padding: 11, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}
              >Log out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      {toasts.length > 0 && (
        <div className="toast-wrap" style={{ bottom: isMobile ? '5.5rem' : '1.5rem' }}>
          {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
        </div>
      )}
    </>
  )
}

// ─── applications view ────────────────────────────────────────
function Applications({ toast }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const width = useWindowWidth()
  const isMobile = width < 640

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/extension/applications')
      const data = await res.json()
      setApps(data.applications || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStatus(id, status) {
    setApps(prev => prev.map(a => a._id === id ? { ...a, status } : a))
    await fetch('/api/extension/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function deleteApp(id) {
    setApps(prev => prev.filter(a => a._id !== id))
    await fetch(`/api/extension/applications?id=${id}`, { method: 'DELETE' })
    toast('Deleted')
  }

  const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 }
  apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })

  return (
    <div className="animate-fade" style={{ padding: isMobile ? '1.25rem 1rem' : '2.5rem', maxWidth: 900, margin: '0 auto', width: '100%', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: isMobile ? '1.375rem' : '1.5rem', fontWeight: 800, letterSpacing: '-.03em', marginBottom: '.375rem' }}>
          Applications
        </h1>
        <p style={{ fontSize: '.875rem', color: '#888', fontWeight: 300 }}>
          Tracked automatically when you use the Chrome extension to apply.
        </p>
      </div>

      {/* Stats — always 4 cols, shrink on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
        gap: isMobile ? 6 : 10,
        marginBottom: '1.75rem',
      }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const c = STATUS_COLORS[key]
          return (
            <div key={key} style={{
              border: `1px solid ${c.border}`, borderRadius: isMobile ? 10 : 12,
              padding: isMobile ? '.625rem .5rem' : '1rem',
              background: c.bg, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                fontSize: isMobile ? '1.25rem' : '1.75rem',
                fontWeight: 800, color: c.color, letterSpacing: '-.04em', lineHeight: 1,
              }}>
                {counts[key]}
              </div>
              <div style={{ fontSize: isMobile ? '10px' : '11.5px', color: c.color, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loading-dots" style={{ color: '#d1d5db' }}><span /><span /><span /></div>
        </div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '3rem 1.25rem' : '5rem 1.5rem', border: '2px dashed #e0e0e0', borderRadius: 16 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💼</div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.5rem' }}>
            No applications yet
          </h2>
          <p style={{ fontSize: '.875rem', color: '#888', fontWeight: 300, maxWidth: 320, margin: '0 auto', lineHeight: 1.65 }}>
            Install the Chrome extension and click <strong style={{ color: '#0a0a0a', fontWeight: 500 }}>⚡ Quick Apply</strong> on any LinkedIn Easy Apply job.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {apps.map(app => {
            const c = STATUS_COLORS[app.status] || STATUS_COLORS.applied
            return (
              <div
                key={app._id}
                style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: isMobile ? '.875rem 1rem' : '1rem 1.25rem', background: '#fff', transition: 'border-color .12s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#bbb'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
              >
                {/* Row 1: title + company + delete */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '.9375rem', letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {app.jobTitle || 'Untitled role'}
                    </p>
                    {app.company && (
                      <span style={{ fontSize: 13, color: '#888', fontWeight: 300 }}>@ {app.company}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteApp(app._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0, transition: 'color .12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                    aria-label="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Row 2: date + link + status pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: '11.5px', color: '#bbb', flexShrink: 0 }}>
                      {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {app.jobUrl && (
                      <a
                        href={app.jobUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: '11.5px', color: '#888', textDecoration: 'none', flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        View job 
                      </a>
                    )}
                  </div>
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app._id, e.target.value)}
                    style={{
                      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                      borderRadius: 999, padding: '4px 8px', fontSize: 12, fontWeight: 600,
                      fontFamily: 'inherit', cursor: 'pointer', outline: 'none', flexShrink: 0,
                    }}
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────
function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); else router.push('/') })
      .catch(() => router.push('/'))
  }, [router])

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="loading-dots" style={{ color: '#d1d5db' }}><span /><span /><span /></div>
    </div>
  )

  return (
    <Shell user={user} toasts={toasts}>
      <Applications user={user} toast={toast} />
    </Shell>
  )
}

const AppClient = dynamic(() => Promise.resolve({ default: App }), { ssr: false })
export default function Page() { return <AppClient /> }