'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// ─── icons ────────────────────────────────────────────────────
function BriefcaseIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h2A1.5 1.5 0 0 1 10 3.5V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1.5 9h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function BoltIcon() { return <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="currentColor"><path d="M160-120v-200q0-33 23.5-56.5T240-400h480q33 0 56.5 23.5T800-320v200H160Zm200-320q-83 0-141.5-58.5T160-640q0-83 58.5-141.5T360-840h240q83 0 141.5 58.5T800-640q0 83-58.5 141.5T600-440H360ZM240-200h480v-120H240v120Zm120-320h240q50 0 85-35t35-85q0-50-35-85t-85-35H360q-50 0-85 35t-35 85q0 50 35 85t85 35Zm28.5-91.5Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm240 0Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5ZM480-200Zm0-440Z"/></svg> }
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }

// ─── nav ──────────────────────────────────────────────────────
const NAV = [
  { id: 'applications', label: 'Applications', href: '/applications', icon: <BriefcaseIcon /> },
  { id: 'auto-apply',   label: 'Auto Apply',   href: '/auto-apply',   icon: <BoltIcon /> },
  { id: 'profile',      label: 'Profile',      href: '/profile',      icon: <UserIcon /> },
]

// ─── autocomplete ─────────────────────────────────────────────
const LOCATIONS = [
  'New York, NY','Los Angeles, CA','Chicago, IL','Houston, TX','Phoenix, AZ',
  'Philadelphia, PA','San Antonio, TX','San Diego, CA','Dallas, TX','San Jose, CA',
  'Austin, TX','Jacksonville, FL','Fort Worth, TX','Columbus, OH','Charlotte, NC',
  'Indianapolis, IN','San Francisco, CA','Seattle, WA','Denver, CO','Nashville, TN',
  'Washington, DC','Las Vegas, NV','Portland, OR','Baltimore, MD','Atlanta, GA',
  'Boston, MA','Miami, FL','Detroit, MI','Minneapolis, MN','Tampa, FL',
  'New Orleans, LA','Sacramento, CA','Kansas City, MO','Raleigh, NC','Salt Lake City, UT',
  'Orlando, FL','Pittsburgh, PA','Cincinnati, OH','St. Louis, MO','Cleveland, OH',
  'Remote','Hybrid','Open to relocation',
  'London, UK','Toronto, Canada','Vancouver, Canada','Montreal, Canada',
  'Sydney, Australia','Melbourne, Australia','Singapore','Dublin, Ireland',
  'Berlin, Germany','Amsterdam, Netherlands','Paris, France','Zurich, Switzerland',
]

function AutocompleteInput({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const containerRef = useRef(null)

  const filtered = value.trim().length === 0
    ? LOCATIONS.slice(0, 8)
    : LOCATIONS.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)

  useEffect(() => {
    function handleClick(e) { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKey(e) {
    if (!open) { if (e.key === 'ArrowDown') setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && hi >= 0) { e.preventDefault(); select(filtered[hi]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  function select(val) { onChange(val); setOpen(false); setHi(-1) }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true); setHi(-1) }} onFocus={() => setOpen(true)} onKeyDown={handleKey} placeholder={placeholder} className="input" autoComplete="off" />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 200, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
          {filtered.map((s, i) => (
            <div key={s} onMouseDown={() => select(s)} onMouseEnter={() => setHi(i)}
              style={{ padding: '.5rem .875rem', fontSize: '.875rem', cursor: 'pointer', background: i === hi ? '#f3f4f6' : '#fff', color: '#111', transition: 'background .1s', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── profile sub-components ───────────────────────────────────
function SectionHead({ title, desc }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ fontSize: '.8125rem', fontWeight: 700, color: '#aaa', letterSpacing: '.08em', textTransform: 'uppercase' }}>{title}</p>
      {desc && <p style={{ fontSize: '.8125rem', color: '#bbb', fontWeight: 300, marginTop: 2 }}>{desc}</p>}
    </div>
  )
}

function TwoCol({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1rem' }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f0f0', margin: '2rem 0' }} />
}

// ─── shell ────────────────────────────────────────────────────
function Shell({ user, toasts, showLogout, setShowLogout, showCancelModal, setShowCancelModal, onConfirmCancel, children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function doLogout() {
    setShowLogout(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const isActive = href => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@300;400;500&display=swap');
        .ds,.ds button,.ds input,.ds textarea,.ds select{font-family:'DM Sans','Inter',sans-serif;-webkit-font-smoothing:antialiased}
        .nav-link{display:flex;align-items:center;gap:.625rem;padding:.5rem .75rem;font-size:.875rem;font-weight:500;border-radius:6px;cursor:pointer;transition:all .12s;background:transparent;border:none;width:100%;text-align:left;color:#888;margin-bottom:2px;text-decoration:none}
        .nav-link:hover,.nav-link.active{background:#f7f7f5;color:#0a0a0a}
      `}</style>

      <div className="ds" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>

        {/* Sidebar */}
        <aside style={{ width: 224, minHeight: '100vh', borderRight: '1px solid #e0e0e0', display: isMobile ? 'none' : 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, background: '#fff', zIndex: 40 }}>
          <div style={{ padding: '1.125rem 1rem .875rem', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <img src="/shamrock.svg" width="26" height="26" alt="reblet" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '-.02em' }}>reblet</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '.625rem .75rem' }}>
            {NAV.map(n => <Link key={n.id} href={n.href} className={`nav-link${isActive(n.href) ? ' active' : ''}`}>{n.icon}{n.label}</Link>)}
          </nav>
          <div style={{ padding: '.875rem', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '.75rem', color: '#bbb', marginBottom: '.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 .25rem' }}>{user.email}</div>
            <button onClick={() => setShowLogout(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#888', padding: '.375rem .5rem', borderRadius: 6, width: '100%', fontFamily: 'inherit', transition: 'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f5'; e.currentTarget.style.color = '#0a0a0a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
            ><LogoutIcon /> Log out</button>
          </div>
        </aside>

        {/* Mobile nav */}
        <nav className="mobile-nav">
          {NAV.map(n => <Link key={n.id} href={n.href} className={`mobile-nav-btn${isActive(n.href) ? ' active' : ''}`}>{n.icon}<span>{n.label}</span></Link>)}
        </nav>

        {/* Main */}
        <main style={{ marginLeft: isMobile ? 0 : 224, flex: 1, minHeight: '100vh', paddingBottom: isMobile ? '5.5rem' : 0 }}>
          {children}
        </main>
      </div>

      {/* Logout confirm */}
      {showLogout && (
        <div onClick={() => setShowLogout(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,.12)', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}><LogoutIcon /></div>
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Log out?</h3>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.75rem' }}>You&apos;ll be signed out. Any unsaved changes will be lost.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: 11, background: 'transparent', color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}>Cancel</button>
              <button onClick={doLogout} style={{ flex: 1, padding: 11, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}>Log out</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel subscription modal */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,.12)' }}>
            <div style={{ width: 44, height: 44, background: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6v4M10 14h.01" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round"/><circle cx="10" cy="10" r="8.25" stroke="#e11d48" strokeWidth="1.5"/></svg>
            </div>
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 8 }}>Cancel subscription?</h3>
            <p style={{ fontSize: 13, color: '#666', fontWeight: 300, lineHeight: 1.65, marginBottom: '1.75rem' }}>
              You&apos;ll keep full access until the end of your current billing period. After that your account will be downgraded.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCancelModal(false)}
                style={{ flex: 1, padding: '10px', background: 'transparent', color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
              >Keep plan</button>
              <button onClick={onConfirmCancel}
                style={{ flex: 1, padding: '10px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#be123c'}
                onMouseLeave={e => e.currentTarget.style.background = '#e11d48'}
              >Yes, cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="toast-wrap">
          {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
        </div>
      )}
    </>
  )
}

// ─── profile view ─────────────────────────────────────────────
function Profile({ user, toast, onLogout, onRequestCancel, cancelingSub }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [form, setForm] = useState({
    fullName:  user.profile?.fullName  || '',
    phone:     user.profile?.phone     || '',
    location:  user.profile?.location  || '',
    linkedin:  user.profile?.linkedin  || '',
    github:    user.profile?.github    || '',
    portfolio: user.profile?.portfolio || '',
    summary:   user.profile?.summary   || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const update = (key, value) => setForm(p => ({ ...p, [key]: value }))

  // Initials avatar
  const initials = (() => {
    const name = form.fullName.trim() || user.email || ''
    const parts = name.split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  })()

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setSaved(true); toast('Profile saved!'); setTimeout(() => setSaved(false), 2500) }
      else toast('Failed to save', 'error')
    } catch { toast('Something went wrong', 'error') }
    setSaving(false)
  }

  const pad = isMobile ? '1.25rem' : '2.5rem'

  return (
    <div style={{ padding: pad, maxWidth: 620, margin: '0 auto', paddingBottom: '5rem' }} className="animate-fade">

      {/* ── Avatar card ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {form.fullName || 'Your Profile'}
          </p>
          <p style={{ fontSize: 13, color: '#aaa', fontWeight: 300, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
        </div>
      </div>

      {/* ── Personal details form ── */}
      <form onSubmit={handleSave}>
        <SectionHead title="Personal details" desc="Used in your resume header" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TwoCol>
            <Field label="Full name">
              <input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jane Doe" className="input" />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="input" />
            </Field>
          </TwoCol>
          <TwoCol>
            <Field label="Location">
              <AutocompleteInput value={form.location} onChange={v => update('location', v)} placeholder="San Francisco, CA" />
            </Field>
            <Field label="Portfolio / Website">
              <input value={form.portfolio} onChange={e => update('portfolio', e.target.value)} placeholder="janedoe.dev" className="input" />
            </Field>
          </TwoCol>
          <TwoCol>
            <Field label="LinkedIn">
              <input value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/janedoe" className="input" />
            </Field>
            <Field label="GitHub">
              <input value={form.github} onChange={e => update('github', e.target.value)} placeholder="github.com/janedoe" className="input" />
            </Field>
          </TwoCol>
          <Field label="Professional summary">
            <textarea value={form.summary} onChange={e => update('summary', e.target.value)} placeholder="2–3 sentences about who you are and what you're looking for." rows={3} className="input" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>
        </div>

        <button type="submit" disabled={saving}
          style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: saved ? '#16a34a' : '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, transition: 'background .2s' }}>
          {saving
            ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Saving…</>
            : saved ? '✓ Saved!' : 'Save changes'
          }
        </button>
      </form>

      <Divider />

      {/* ── Membership ── */}
      <SectionHead title="Membership" />

      {(() => {
        const cancelAt = user.subscriptionCancelAt ? new Date(user.subscriptionCancelAt) : null
        const isCanceling = user.subscriptionActive && cancelAt

        // ── State 1: no subscription ──────────────────────────────
        if (!user.subscriptionActive) return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '1rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="5" width="12" height="9" rx="1.5" stroke="#9ca3af" strokeWidth="1.3"/><path d="M5 5V4a3 3 0 0 1 6 0v1" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>No active plan</p>
                <p style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>Upgrade to unlock all features</p>
              </div>
            </div>
            <a href="/paywall" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: '#0a0a0a', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Upgrade to Pro →
            </a>
          </div>
        )

        // ── State 2: active but scheduled to cancel ───────────────
        if (isCanceling) return (
          <div style={{ border: '1px solid #fde68a', borderRadius: 12, background: '#fffbeb', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5v4M8 11h.01" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="8" r="6.25" stroke="#d97706" strokeWidth="1.3"/></svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Pro — Cancels soon</p>
                  <span style={{ background: '#d97706', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 8px', letterSpacing: '.04em' }}>CANCELING</span>
                </div>
                <p style={{ fontSize: 12, color: '#b45309', fontWeight: 400 }}>
                  Your subscription ends on{' '}
                  <strong>
                    {cancelAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </strong>
                  . You have full access until then.
                </p>
              </div>
            </div>
          </div>
        )

        // ── State 3: fully active ─────────────────────────────────
        return (
          <div style={{ border: '1px solid #bbf7d0', borderRadius: 12, background: '#f0fdf4', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Pro — Active</p>
                  <span style={{ background: '#16a34a', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 8px', letterSpacing: '.04em' }}>ACTIVE</span>
                </div>
                <p style={{ fontSize: 12, color: '#4ade80', fontWeight: 400 }}>$20 / month · 700 auto-applications included</p>
              </div>
            </div>
            <div style={{ padding: '.75rem 1.25rem', borderTop: '1px solid #bbf7d0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 12, color: '#bbb', lineHeight: 1.5 }}>You keep access until the end of the billing period if you cancel.</p>
              <button onClick={onRequestCancel} disabled={cancelingSub}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'transparent', border: '1px solid #fecdd3', color: '#e11d48', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: cancelingSub ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: cancelingSub ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                {cancelingSub && <span style={{ width: 11, height: 11, border: '1.5px solid #e11d4844', borderTopColor: '#e11d48', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
                {cancelingSub ? 'Canceling…' : 'Cancel subscription'}
              </button>
            </div>
          </div>
        )
      })()}

      <Divider />

      {/* ── Account ── */}
      <SectionHead title="Account" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>Sign out</p>
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Sign out of your account on this device.</p>
        </div>
        <button onClick={onLogout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', color: '#555', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.color = '#0a0a0a' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#555' }}
        >
          <LogoutIcon /> Log out
        </button>
      </div>

    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────
function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [toasts, setToasts] = useState([])
  const [showLogout, setShowLogout]           = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelingSub, setCancelingSub]       = useState(false)

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user)
      else router.push('/')
    }).catch(() => router.push('/'))
  }, [router])

  async function handleCancelSub() {
    setShowCancelModal(false)
    setCancelingSub(true)
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        // Update user in-place so the cancellation date shows immediately
        setUser(prev => ({ ...prev, subscriptionCancelAt: data.cancelAt }))
        toast('Subscription canceled.')
      } else {
        toast('Failed to cancel — try again.', 'error')
      }
    } catch { toast('Something went wrong', 'error') }
    setCancelingSub(false)
  }

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="loading-dots"><span /><span /><span /></div></div>

  return (
    <Shell
      user={user} toasts={toasts}
      showLogout={showLogout} setShowLogout={setShowLogout}
      showCancelModal={showCancelModal} setShowCancelModal={setShowCancelModal}
      onConfirmCancel={handleCancelSub}
    >
      <Profile
        user={user} toast={toast}
        onLogout={() => setShowLogout(true)}
        onRequestCancel={() => setShowCancelModal(true)}
        cancelingSub={cancelingSub}
      />
    </Shell>
  )
}

const AppClient = dynamic(() => Promise.resolve({ default: App }), { ssr: false })
export default function Page() { return <AppClient /> }
