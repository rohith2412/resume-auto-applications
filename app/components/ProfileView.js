'use client'

import { useState, useEffect } from 'react'
import AutocompleteInput, { LOCATIONS } from './AutocompleteInput'

function ProfileSection({ title, desc, children }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>{title}</p>
        {desc && <p style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 300, marginTop: '0.125rem' }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function TwoCol({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>{children}</div>
}

function PRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '11px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

export default function ProfileView({ user, toast }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
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
  const [cancelingSub, setCancelingSub] = useState(false)
  const [subCanceled, setSubCanceled] = useState(false)

  function update(key, value) { setForm(p => ({ ...p, [key]: value })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) toast('Profile saved!')
      else toast('Failed to save', 'error')
    } catch { toast('Something went wrong', 'error') }
    setSaving(false)
  }

  async function handleCancelSub() {
    if (!window.confirm('Cancel your subscription? You\'ll keep access until the end of your billing period.')) return
    setCancelingSub(true)
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' })
      if (res.ok) { setSubCanceled(true); toast('Subscription canceled.') }
      else toast('Failed to cancel — try again.', 'error')
    } catch { toast('Something went wrong', 'error') }
    setCancelingSub(false)
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '2.5rem', maxWidth: '640px', margin: '0 auto', paddingBottom: '4rem' }} className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>Profile</h1>
        <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300 }}>Your profile info is used as the default for new resumes.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <ProfileSection title="Personal details" desc="Shows in your resume header">
          <TwoCol>
            <PRow label="Full name"><input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jane Doe" className="input" /></PRow>
            <PRow label="Phone"><input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="input" /></PRow>
          </TwoCol>
          <TwoCol>
            <PRow label="Location"><AutocompleteInput value={form.location} onChange={v => update('location', v)} placeholder="San Francisco, CA" suggestions={LOCATIONS} /></PRow>
            <PRow label="Portfolio / Website"><input value={form.portfolio} onChange={e => update('portfolio', e.target.value)} placeholder="janedoe.dev" className="input" /></PRow>
          </TwoCol>
          <TwoCol>
            <PRow label="LinkedIn URL"><input value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/janedoe" className="input" /></PRow>
            <PRow label="GitHub URL"><input value={form.github} onChange={e => update('github', e.target.value)} placeholder="github.com/janedoe" className="input" /></PRow>
          </TwoCol>
          <PRow label="Professional summary">
            <textarea value={form.summary} onChange={e => update('summary', e.target.value)} placeholder="2–3 sentences about who you are and what you're looking for." rows={3} className="input" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </PRow>
        </ProfileSection>

        <div>
          <button type="submit" disabled={saving} className="btn btn-black" style={{ minWidth: '150px', height: '42px' }}>
            {saving ? <span className="spinner" /> : 'Save all changes'}
          </button>
        </div>
      </form>

      {/* Membership card */}
      <div style={{ marginTop: '2.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="5" width="12" height="9" rx="1.5" stroke="#888" strokeWidth="1.3"/><path d="M5 5V4a3 3 0 0 1 6 0v1" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>Membership</span>
        </div>
        <div style={{ padding: '1.25rem' }}>
          {subCanceled || !user.subscriptionActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: '#888' }}>No active subscription</span>
              </div>
              <a href="/paywall" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '9px 20px', background: '#0a0a0a', color: '#fff', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', width: 'fit-content' }}>
                Upgrade to Pro →
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a' }}>Pro — Active</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: '#888' }}>$20 / month · 700 auto-applications</span>
                </div>
                <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 99, fontSize: 11, fontWeight: 600, padding: '3px 10px' }}>Active</span>
              </div>
              <button
                onClick={handleCancelSub}
                disabled={cancelingSub}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #fecdd3', color: '#e11d48', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, cursor: cancelingSub ? 'not-allowed' : 'pointer', width: 'fit-content', fontFamily: 'inherit', opacity: cancelingSub ? 0.6 : 1 }}
              >
                {cancelingSub ? <span className="spinner" style={{ width: 13, height: 13, borderColor: '#e11d48', borderTopColor: 'transparent' }} /> : (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                )}
                Cancel subscription
              </button>
              <p style={{ fontSize: '0.75rem', color: '#bbb', lineHeight: 1.5 }}>
                You&apos;ll keep access until the end of your current billing period. No refunds for partial months.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
