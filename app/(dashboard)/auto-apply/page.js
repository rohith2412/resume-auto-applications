'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// ─── icons ────────────────────────────────────────────────────
function BoltIcon() { return <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="currentColor"><path d="M160-120v-200q0-33 23.5-56.5T240-400h480q33 0 56.5 23.5T800-320v200H160Zm200-320q-83 0-141.5-58.5T160-640q0-83 58.5-141.5T360-840h240q83 0 141.5 58.5T800-640q0 83-58.5 141.5T600-440H360ZM240-200h480v-120H240v120Zm120-320h240q50 0 85-35t35-85q0-50-35-85t-85-35H360q-50 0-85 35t-35 85q0 50 35 85t85 35Zm28.5-91.5Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm240 0Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5ZM480-200Zm0-440Z"/></svg> }
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }

// ─── nav ──────────────────────────────────────────────────────
const NAV = [
  { id: 'auto-apply',   label: 'Auto Apply',   href: '/auto-apply',   icon: <BoltIcon /> },
  { id: 'profile',      label: 'Profile',      href: '/profile',      icon: <UserIcon /> },
]

// ─── applications config ─────────────────────────────────────
const STATUS_LABELS = { applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' }
const STATUS_COLORS = {
  applied:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  interview: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  offer:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:  { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
}

function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10M4.5 3.5V2h4v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3.5l-.75 7.5h-5.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

// ─── form sub-components ──────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: '#bbb' }}>{hint}</span>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid #f0f0f0', paddingBottom: 7, marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

const INP = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e8e8e8', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0a0a0a', background: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }

function Input({ value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)
  return <input value={value ?? ''} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...INP, borderColor: focused ? '#0a0a0a' : '#e8e8e8' }} {...props} />
}

function Select({ value, onChange, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return <select value={value ?? ''} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...INP, borderColor: focused ? '#0a0a0a' : '#e8e8e8', cursor: 'pointer' }} {...props}>{children}</select>
}

// ─── shell ────────────────────────────────────────────────────
function Shell({ user, toasts, children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogout, setShowLogout] = useState(false)
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

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="toast-wrap">
          {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
        </div>
      )}
    </>
  )
}

// ─── auto apply view ──────────────────────────────────────────
function ExtensionBanner({ dismissed, onDismiss }) {
  if (dismissed) return null
  return (
    <div style={{ background: 'linear-gradient(135deg,#0f0f0f 0%,#1a1a2e 100%)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>🧩</span>
        <div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Install the reblet Chrome Extension</p>
          <p style={{ color: '#999', fontSize: 11.5, fontWeight: 300 }}>Required to auto-apply on LinkedIn. Takes 10 seconds.</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <a href="https://chromewebstore.google.com/detail/pncleeecacohjhfkcgebaiepnjahbhip?utm_source=item-share-cb" target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', color: '#0f0f0f', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Add to Chrome <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#666', fontSize: 16, cursor: 'pointer', padding: '4px 6px', lineHeight: 1 }} aria-label="Dismiss">&times;</button>
      </div>
    </div>
  )
}

function AutoApply({ user }) {
  const jp = user?.jobPreferences || {}

  const [isMobile, setIsMobile] = useState(false)
  const [extInstalled, setExtInstalled] = useState(true)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (document.documentElement.dataset.rebletExtension !== '1') {
        setExtInstalled(false)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const [form, setForm] = useState({
    keywords:         jp.keywords         || '',
    searchLocation:   jp.searchLocation   || '',
    workType:         jp.workType         || '',
    linkedinExpLevel: jp.linkedinExpLevel || '',
  })
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState('')
  const [apiKey, setApiKey]               = useState(user?.apiKey || '')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copied, setCopied]               = useState(false)

  useEffect(() => {
    fetch('/api/auto-apply/settings').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return
      setForm({ keywords: d.keywords ?? '', searchLocation: d.searchLocation ?? '', workType: d.workType ?? '', linkedinExpLevel: d.linkedinExpLevel ?? '' })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/extension/generate-key').then(r => r.json()).then(d => { if (d.apiKey) setApiKey(d.apiKey) }).catch(() => {})
  }, [])

  const set = key => val => setForm(f => ({ ...f, [key]: val }))

  async function generateKey() {
    setGeneratingKey(true)
    try {
      const res = await fetch('/api/extension/generate-key', { method: 'POST' })
      const data = await res.json()
      if (data.apiKey) setApiKey(data.apiKey)
    } finally { setGeneratingKey(false) }
  }

  function copyKey() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.keywords || !form.searchLocation) { setError('Please fill in Job Title to Search and Search Location.'); return }
    setError(''); setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/auto-apply', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: form.keywords, searchLocation: form.searchLocation, workType: form.workType, linkedinExpLevel: form.linkedinExpLevel }) })
      if (!res.ok) { setError('Failed to save. Try again.'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  function openLinkedIn() {
    const params = new URLSearchParams({ f_AL: 'true', keywords: form.keywords || '', location: form.searchLocation || '', sortBy: 'R', refresh: 'true' })
    if (form.workType) params.set('f_WT', form.workType)
    if (form.linkedinExpLevel) params.set('f_E', form.linkedinExpLevel)
    window.open(`https://www.linkedin.com/jobs/search/?${params.toString()}`, '_blank')
  }

  const wtLabel = { '': 'Any', '2': 'Remote', '3': 'Hybrid', '1': 'On-site' }
  const elLabel = { '': 'Any', '1': 'Internship', '2': 'Entry Level', '3': 'Associate', '4': 'Mid-Senior' }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '1rem' : '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: isMobile ? 24 : 32, alignItems: 'start' }}>

      {!extInstalled && (
        <div style={{ gridColumn: '1 / -1' }}>
          <ExtensionBanner dismissed={bannerDismissed} onDismiss={() => setBannerDismissed(true)} />
        </div>
      )}

      {/* Left: search form */}
      <form onSubmit={handleSave}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6, lineHeight: 1.2 }}>
          Auto <em style={{ fontStyle: 'italic', color: '#888' }}>Apply.</em>
        </h1>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 28, fontWeight: 300, lineHeight: 1.6 }}>
          Set your job search preferences. The extension uses these to filter LinkedIn and auto-fill every Easy Apply form.
        </p>

        <Section title="LinkedIn Job Search">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Job Title to Search *" hint="e.g. Software Engineer Intern"><Input value={form.keywords} onChange={set('keywords')} placeholder="Software Engineer Intern" required /></Field>
            <Field label="Search Location *" hint="e.g. Canada, Toronto, Remote"><Input value={form.searchLocation} onChange={set('searchLocation')} placeholder="Canada" required /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Work Type">
              <Select value={form.workType} onChange={set('workType')}><option value="">Any</option><option value="2">Remote</option><option value="3">Hybrid</option><option value="1">On-site</option></Select>
            </Field>
            <Field label="Experience Level">
              <Select value={form.linkedinExpLevel} onChange={set('linkedinExpLevel')}><option value="">Any</option><option value="1">Internship</option><option value="2">Entry Level</option><option value="3">Associate</option><option value="4">Mid-Senior</option></Select>
            </Field>
          </div>
        </Section>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={saving}
          style={{ width: '100%', padding: '12px 20px', background: saved ? '#16a34a' : '#0a0a0a', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '-.01em', transition: 'background .2s', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* Right: sidebar cards */}
      <div style={{ position: isMobile ? 'static' : 'sticky', top: 24 }}>

        {(form.keywords || form.searchLocation) && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Search Preview</div>
            <p style={{ fontSize: 12.5, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>
              <strong style={{ color: '#0a0a0a' }}>{form.keywords || '-'}</strong>
              {form.searchLocation && <> in {form.searchLocation}</>}
              {(form.workType || form.linkedinExpLevel) && <span style={{ color: '#aaa' }}> · {[wtLabel[form.workType], elLabel[form.linkedinExpLevel]].filter(Boolean).join(' · ')}</span>}
            </p>
            <button type="button" onClick={openLinkedIn}
              style={{ width: '100%', padding: '9px 10px', background: '#0a66c2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Open on LinkedIn
            </button>
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Extension API Key</div>
          {apiKey ? (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, background: '#f7f7f5', border: '1px solid #e8e8e8', borderRadius: 7, padding: '8px 10px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apiKey}</code>
                <button type="button" onClick={copyKey}
                  style={{ padding: '8px 12px', background: copied ? '#f0fdf4' : '#0a0a0a', color: copied ? '#16a34a' : '#fff', border: `1px solid ${copied ? '#bbf7d0' : '#0a0a0a'}`, borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .15s' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <button type="button" onClick={generateKey} disabled={generatingKey} style={{ fontSize: 11, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                {generatingKey ? 'Regenerating…' : 'Regenerate key'}
              </button>
            </>
          ) : (
            <button type="button" onClick={generateKey} disabled={generatingKey}
              style={{ width: '100%', padding: '9px 14px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generatingKey ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generatingKey ? 0.6 : 1 }}>
              {generatingKey ? 'Generating…' : 'Generate API Key'}
            </button>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
          <a href="https://chromewebstore.google.com/detail/pncleeecacohjhfkcgebaiepnjahbhip?utm_source=item-share-cb" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', background: 'linear-gradient(135deg,#0f0f0f 0%,#1a1a2e 100%)', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/Chrome.png" width="18" height="18" alt="Chrome" style={{ display: 'block' }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>Get the reblet Chrome Extension</span>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: '#0f0f0f', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Add to Chrome <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </a>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>How to Start</div>
            {[
              ['1','Set your search','Fill in job title + location and click "Save Settings".'],
              ['2','Get your API key','Click "Generate API Key" and copy it.'],
              ['3','Open the extension','Click the reblet icon in Chrome.'],
              ['4','Paste your API key','Paste it in the extension popup and click Connect.'],
              ['5','Go to LinkedIn Jobs','Click "Open on LinkedIn" - jobs are pre-filtered for Easy Apply.'],
              ['6','Hit Start Auto Apply','The extension handles everything from here.'],
            ].map(([n, title, desc]) => (
              <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0a0a0a', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0a0a0a', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 11.5, color: '#888', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── applications view ────────────────────────────────────────
function Applications({ toast }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
    <div className="animate-fade" style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: isMobile ? '1.25rem 1rem' : '1rem 2.5rem 2.5rem' }}>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
        gap: isMobile ? 6 : 10,
        marginBottom: '1.5rem',
      }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const c = STATUS_COLORS[key]
          return (
            <div key={key} style={{
              border: `1px solid ${c.border}`, borderRadius: isMobile ? 10 : 12,
              padding: isMobile ? '.625rem .5rem' : '.875rem',
              background: c.bg, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 800, color: c.color, letterSpacing: '-.04em', lineHeight: 1,
              }}>
                {counts[key]}
              </div>
              <div style={{ fontSize: isMobile ? '10px' : '11px', color: c.color, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loading-dots" style={{ color: '#d1d5db' }}><span /><span /><span /></div>
        </div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem' : '3.5rem 1.5rem', border: '2px dashed #e0e0e0', borderRadius: 16 }}>
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>💼</div>
          <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.375rem' }}>
            No applications yet
          </h3>
          <p style={{ fontSize: '.8125rem', color: '#888', fontWeight: 300, maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
            Use the Chrome extension to auto-apply - applications will appear here.
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: '11.5px', color: '#bbb', flexShrink: 0 }}>
                      {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {app.jobUrl && (
                      <a href={app.jobUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: '11.5px', color: '#888', textDecoration: 'none', flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >View job ↗</a>
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
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user)
      else router.push('/')
    }).catch(() => router.push('/'))
  }, [router])

  const [tab, setTab] = useState('auto-apply')

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="loading-dots"><span /><span /><span /></div></div>

  return (
    <Shell user={user} toasts={toasts}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 2.5rem 0' }}>
        <div style={{ display: 'inline-flex', background: '#f3f4f6', borderRadius: 10, padding: 3, marginBottom: 8 }}>
          {[['auto-apply', 'Auto Apply'], ['applications', 'Applications']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? '#0a0a0a' : '#888',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
      </div>
      {tab === 'auto-apply' && <AutoApply user={user} toast={toast} />}
      {tab === 'applications' && <Applications toast={toast} />}
    </Shell>
  )
}

const AppClient = dynamic(() => Promise.resolve({ default: App }), { ssr: false })
export default function Page() { return <AppClient /> }
