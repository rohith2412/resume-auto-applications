'use client'

import { useState, useEffect, useCallback } from 'react'

const STATUS_LABELS = { applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' }
const STATUS_COLORS = {
  applied:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  interview: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  offer:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:  { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
}

function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10M4.5 3.5V2h4v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3.5l-.75 7.5h-5.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }

export default function ApplicationsView({ toast }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
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
    <div style={{ padding: isMobile ? '1rem' : '2.5rem', maxWidth: '900px', margin: '0 auto' }} className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>Applications</h1>
        <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300 }}>Tracked automatically when you use the Chrome extension to apply.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const c = STATUS_COLORS[key]
          return (
            <div key={key} style={{ border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1rem', background: c.bg, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.75rem', fontWeight: 800, color: c.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{counts[key]}</div>
              <div style={{ fontSize: '11.5px', color: c.color, fontWeight: 500, marginTop: '4px', opacity: 0.8 }}>{label}</div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loading-dots" style={{ color: '#d1d5db' }}><span /><span /><span /></div>
        </div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', border: '2px dashed #e0e0e0', borderRadius: '16px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💼</div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>No applications yet</h2>
          <p style={{ fontSize: '0.9rem', color: '#888', fontWeight: 300, maxWidth: '340px', margin: '0 auto', lineHeight: 1.65 }}>
            Install the Chrome extension and click <strong style={{ color: '#0a0a0a', fontWeight: 500 }}>⚡ Quick Apply</strong> on any LinkedIn Easy Apply job.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {apps.map(app => {
            const c = STATUS_COLORS[app.status] || STATUS_COLORS.applied
            return (
              <div key={app._id} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.625rem' : '1rem', background: '#fff', transition: 'border-color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#bbb'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobTitle || 'Untitled role'}</p>
                    {app.company && <span style={{ fontSize: '13px', color: '#888', fontWeight: 300, flexShrink: 0 }}>@ {app.company}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: '#bbb' }}>
                      {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {app.jobUrl && (
                      <a href={app.jobUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11.5px', color: '#888', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                        View job ↗
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', gap: '0.5rem' }}>
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app._id, e.target.value)}
                    style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>

                  <button onClick={() => deleteApp(app._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '4px', borderRadius: '6px', display: 'flex', transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
