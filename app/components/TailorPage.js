'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ToastProvider, useToast } from './Toast'
import ResumeEditor from './ResumeEditor'
import ResumePreview from './ResumePreview'
import AutocompleteInput, { LOCATIONS, UNIVERSITIES } from './AutocompleteInput'
import AutoApplyClient from '../auto-apply/AutoApplyClient'

export default function TailorPage({ user }) {
  return (
    <ToastProvider>
      <AppShell user={user} />
    </ToastProvider>
  )
}

function AppShell({ user }) {
  const router = useRouter()
  const toast = useToast()
  const [view, setViewState] = useState('applications')
  const [openResumeId, setOpenResumeId] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Restore last-visited tab on mount
  useEffect(() => {
    const saved = localStorage.getItem('reblet_view')
    if (saved) setViewState(saved)
  }, [])

  function setView(v) {
    setViewState(v)
    localStorage.setItem('reblet_view', v)
  }

  async function handleLogout() {
    setShowLogoutConfirm(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  function openResume(id) { setOpenResumeId(id) }
  function closeResume() { setOpenResumeId(null) }

  // When a resume is open, show the full-screen editor (no sidebar)
  if (openResumeId) {
    return (
      <ResumeEditor
        resumeId={openResumeId}
        user={user}
        onBack={closeResume}
        toast={toast}
      />
    )
  }

  const NAV = [
    { id: 'applications', label: 'Applications', icon: <BriefcaseIcon /> },
    { id: 'auto-apply',   label: 'Auto Apply',   icon: <BoltIcon /> },
    { id: 'profile',      label: 'Profile',      icon: <UserIcon /> },
  ]

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@300;400;500&display=swap');
      .app-shell, .app-shell button, .app-shell input, .app-shell textarea, .app-shell select {
        font-family: 'DM Sans', 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .app-nav-item {
        display: flex; align-items: center; gap: 0.625rem;
        padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500;
        border-radius: 6px; cursor: pointer; transition: all 0.12s;
        background: transparent; border: none; width: 100%;
        text-align: left; color: #888; margin-bottom: 2px;
      }
      .app-nav-item:hover { background: #f7f7f5; color: #0a0a0a; }
      .app-nav-item.active { background: #f7f7f5; color: #0a0a0a; }
    `}</style>
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
      {/* Sidebar */}
      <aside style={{ width: '224px', minHeight: '100vh', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, background: '#fff', zIndex: 40 }}>
        <div style={{ padding: '1.125rem 1rem 0.875rem', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="26" height="26" viewBox="100 85 200 230" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
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
            <span style={{ fontWeight: 500, fontSize: '14px', letterSpacing: '-0.02em' }}>reblet</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.625rem 0.75rem' }}>
          {NAV.map(n => (
            <NavItem key={n.id} icon={n.icon} label={n.label} active={view === n.id} onClick={() => setView(n.id)} />
          ))}
        </nav>

        <div style={{ padding: '0.875rem', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '0.75rem', color: '#bbb', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.25rem' }}>
            {user.email}
          </div>
          <LogoutBtn onClick={() => setShowLogoutConfirm(true)} />
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="mobile-nav">
        {NAV.map(n => (
          <button key={n.id} className={`mobile-nav-btn ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
            {n.icon}<span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Main */}
      <main style={{ marginLeft: '224px', flex: 1, minHeight: '100vh' }}>
        {view === 'dashboard'    && <DashboardView user={user} toast={toast} onOpenResume={openResume} />}
        {view === 'applications' && <ApplicationsView toast={toast} />}
        {view === 'auto-apply'   && <AutoApplyClient user={user} />}
        {view === 'profile'      && <ProfileView user={user} toast={toast} />}
      </main>
    </div>

    {/* Logout confirmation */}
    {showLogoutConfirm && (
      <div
        onClick={() => setShowLogoutConfirm(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', textAlign: 'center' }}
        >
          <div style={{ width: 44, height: 44, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <LogoutIcon />
          </div>
          <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Log out?</h3>
          <p style={{ fontSize: '13px', color: '#888', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.75rem' }}>
            You'll be signed out of your account. Any unsaved changes will be lost.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{ flex: 1, padding: '11px', background: 'transparent', color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans','Inter',sans-serif", transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              style={{ flex: 1, padding: '11px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans','Inter',sans-serif", transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#333'}
              onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

/* ──────────────────────────────────────────────────────────────
   DASHBOARD VIEW
────────────────────────────────────────────────────────────── */
function DashboardView({ user, toast, onOpenResume }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/resumes')
      const data = await res.json()
      setResumes(data.resumes || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createResume(opts = {}) {
    setCreating(true)
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
      const data = await res.json()
      if (res.ok) {
        toast('Resume created!')
        onOpenResume(data.resume._id)
      } else { toast(data.error || 'Failed to create', 'error') }
    } catch { toast('Something went wrong', 'error') }
    setCreating(false)
  }

  async function deleteResume(id) {
    await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
    toast('Deleted')
    setResumes(prev => prev.filter(r => r._id !== id))
  }

  async function duplicateResume(id) {
    try {
      const res = await fetch(`/api/resumes/${id}`)
      const data = await res.json()
      if (!res.ok) return toast('Failed to duplicate', 'error')
      const orig = data.resume
      const newRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${orig.name} (copy)`,
          template: orig.template,
          personalInfo: orig.personalInfo,
          education: orig.education,
          skills: orig.skills,
        }),
      })
      const newData = await newRes.json()
      if (newRes.ok) {
        // Copy all fields
        await fetch(`/api/resumes/${newData.resume._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: orig.summary, experience: orig.experience, projects: orig.projects, certifications: orig.certifications }),
        })
        toast('Duplicated!')
        load()
      }
    } catch { toast('Something went wrong', 'error') }
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1100px', margin: '0 auto' }} className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>My Resumes</h1>
          <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300 }}>Build, score, and download your resumes.</p>
        </div>
        <button className="btn btn-black" onClick={() => setShowNewModal(true)} disabled={creating} style={{ flexShrink: 0 }}>
          {creating ? <span className="spinner" style={{ width: '15px', height: '15px' }} /> : '+ New Resume'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <div className="loading-dots" style={{ color: '#d1d5db' }}><span /><span /><span /></div>
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState onCreate={() => setShowNewModal(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {resumes.map(r => (
            <ResumeCard
              key={r._id} resume={r}
              onClick={() => onOpenResume(r._id)}
              onDelete={() => deleteResume(r._id)}
              onDuplicate={() => duplicateResume(r._id)}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewResumeModal
          onClose={() => setShowNewModal(false)}
          onCreate={opts => { setShowNewModal(false); createResume(opts) }}
          hasProfile={!!(user.profile?.fullName)}
        />
      )}
    </div>
  )
}

function ResumeCard({ resume, onClick, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const score = resume.score
  const scoreColor = score === null || score === undefined ? '#9ca3af' : score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  const scoreBg = score === null || score === undefined ? '#f3f4f6' : score >= 80 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2'

  return (
    <div
      style={{ border: '1px solid #e0e0e0', borderRadius: '16px', background: '#fff', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#bbb' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#e0e0e0' }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div style={{ height: '160px', background: '#f1f5f9', overflow: 'hidden', position: 'relative', borderRadius: '16px 16px 0 0' }}>
        <ResumeThumbnail resume={resume} />
        {/* Fade to white at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, transparent, #f1f5f9)', pointerEvents: 'none' }} />
        {/* Template badge */}
        <div style={{ position: 'absolute', top: '0.625rem', left: '0.625rem' }}>
          <TemplateBadge template={resume.template} />
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '1rem 1rem 0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.125rem' }}>{resume.name}</p>
            {resume.personalInfo?.fullName && (
              <p style={{ fontSize: '0.8125rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resume.personalInfo.fullName}</p>
            )}
          </div>
          {/* Menu */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.375rem', color: '#9ca3af' }} onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}>
              <DotsIcon />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '140px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <MenuBtn onClick={() => { setMenuOpen(false); onDuplicate() }}>Duplicate</MenuBtn>
                <MenuBtn onClick={() => { setMenuOpen(false); onDelete() }} danger>Delete</MenuBtn>
              </div>
            )}
          </div>
        </div>

        {/* Score + date row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {score !== null && score !== undefined ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: scoreBg, color: scoreColor, borderRadius: '999px', padding: '0.2rem 0.625rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: scoreColor, flexShrink: 0 }} />
              {score}/100
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#bbb', fontStyle: 'italic' }}>Not scored yet</span>
          )}
          <span style={{ fontSize: '0.75rem', color: '#bbb' }}>
            {new Date(resume.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

function ResumeThumbnail({ resume }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(0.35)
  const W = 816

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width
      if (width > 0) setScale(width / W)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: W + 'px', transformOrigin: 'top left', transform: 'scale(' + scale + ')' }}>
        <ResumePreview resume={resume} template={resume?.template || 'classic'} />
      </div>
    </div>
  )
}

function TemplateBadge({ template }) {
  const colors = { classic: { bg: '#eff6ff', color: '#2563eb' }, modern: { bg: '#f0fdf4', color: '#16a34a' }, minimal: { bg: '#f9fafb', color: '#6b7280' } }
  const c = colors[template] || colors.classic
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30`, borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'capitalize' }}>
      {template}
    </span>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', border: '2px dashed #e0e0e0', borderRadius: '16px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
      <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>No resumes yet</h2>
      <p style={{ fontSize: '0.9375rem', color: '#888', marginBottom: '2rem', maxWidth: '360px', margin: '0 auto 2rem', lineHeight: 1.65, fontWeight: 300 }}>
        Create your first resume and use AI to build, score, tailor it to jobs, and generate cover letters.
      </p>
      <button className="btn btn-black btn-lg" onClick={onCreate}>+ Create my first resume</button>
    </div>
  )
}

function NewResumeModal({ onClose, onCreate, hasProfile }) {
  const [name, setName] = useState('')
  const [prefill, setPrefill] = useState(hasProfile)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', padding: '1rem' }} onClick={onClose}>
      <div className="animate-fadeup" style={{ background: '#fff', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e0e0e0', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>New resume</h2>
            <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300 }}>Give it a name and start building.</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.375rem' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4b5563' }}>Resume name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate({ name: name.trim(), prefillFromProfile: prefill })}
              placeholder="e.g. Software Engineer — Google"
              className="input"
            />
          </div>

          {hasProfile && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <div onClick={() => setPrefill(v => !v)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: prefill ? 'none' : '1.5px solid #d1d5db', background: prefill ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', cursor: 'pointer' }}>
                {prefill && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ lineHeight: 1.5 }}>Pre-fill with my profile info (name, contact, education, skills)</span>
            </label>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-black" onClick={() => name.trim() && onCreate({ name: name.trim(), prefillFromProfile: prefill })} disabled={!name.trim()} style={{ flex: 2 }}>
            Create resume →
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}

/* ──────────────────────────────────────────────────────────────
   HISTORY VIEW
────────────────────────────────────────────────────────────── */
function HistoryView({ toast }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      setHistory(data.history || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    await fetch(`/api/history/${id}`, { method: 'DELETE' })
    toast('Deleted')
    load()
    if (selected?._id === id) setSelected(null)
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    toast('Copied!')
  }

  async function handleDownload(text) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 54, pageWidth = doc.internal.pageSize.getWidth(), pageHeight = doc.internal.pageSize.getHeight()
    const maxWidth = pageWidth - margin * 2
    let y = margin
    text.split('\n').forEach(line => {
      const trimmed = line.trimEnd()
      if (!trimmed) { y += 6; return }
      const isHeader = /^[A-Z][A-Z\s&/]+$/.test(trimmed) && trimmed.length < 60 && !trimmed.includes(',')
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal')
      doc.setFontSize(isHeader ? 9.5 : 9)
      const wrapped = doc.splitTextToSize(trimmed, maxWidth)
      wrapped.forEach(wl => {
        if (y + 14 > pageHeight - margin) { doc.addPage(); y = margin }
        doc.text(wl, margin, y)
        y += isHeader ? 14 : 13
      })
      if (isHeader) { doc.setDrawColor(180, 180, 180); doc.line(margin, y - 3, pageWidth - margin, y - 3); y += 4 }
    })
    doc.save('tailored-resume.pdf')
    toast('Downloaded!')
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px', margin: '0 auto' }} className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>Tailor History</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>All your previously tailored resumes.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loading-dots" style={{ color: '#d1d5db' }}><span /><span /><span /></div>
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', border: '1px dashed #e5e7eb', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
          <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>No history yet</p>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Tailor a resume to a job to see it here.</p>
        </div>
      ) : selected ? (
        <div className="animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>← Back</button>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{selected.jobTitle || 'Tailored Resume'}</p>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleCopy(selected.resumeText)}><CopyIcon /> Copy</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(selected.resumeText)}><DownloadIcon /> PDF</button>
            </div>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '2rem', background: '#fafafa', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {selected.resumeText}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {history.map(item => (
            <div key={item._id}
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', transition: 'border-color 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#000'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              onClick={() => setSelected(item)}
            >
              <div style={{ width: '34px', height: '34px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#2563eb' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h5M5 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.jobTitle || 'Tailored Resume'}</p>
                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.resumeText?.slice(0, 70)}...</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleDelete(item._id) }} style={{ color: '#dc2626', padding: '0.25rem 0.5rem' }}><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   PROFILE VIEW
────────────────────────────────────────────────────────────── */
function ProfileView({ user, toast }) {
  const [form, setForm] = useState({
    fullName: user.profile?.fullName || '',
    phone: user.profile?.phone || '',
    location: user.profile?.location || '',
    linkedin: user.profile?.linkedin || '',
    github: user.profile?.github || '',
    portfolio: user.profile?.portfolio || '',
    summary: user.profile?.summary || '',
    university: user.education?.university || '',
    degree: user.education?.degree || '',
    gpa: user.education?.gpa || '',
    graduationYear: user.education?.graduationYear || '',
    relevantCourses: user.education?.relevantCourses || '',
    technical: user.skills?.technical || '',
    languages: user.skills?.languages || '',
    tools: user.skills?.tools || '',
    soft: user.skills?.soft || '',
    targetRole: user.jobPreferences?.targetRole || '',
    experienceLevel: user.jobPreferences?.experienceLevel || '',
    preferredLocation: user.jobPreferences?.preferredLocation || '',
    remote: user.jobPreferences?.remote || false,
    openToRelocation: user.jobPreferences?.openToRelocation || false,
    targetCompanies: user.jobPreferences?.targetCompanies || '',
    availableFrom: user.jobPreferences?.availableFrom || '',
    expectedSalary: user.jobPreferences?.expectedSalary || '',
  })
  const [saving, setSaving] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const hasResume = !!user.resumeText

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

  async function handleResumeUpload() {
    if (!resumeFile) return
    setUploadingResume(true)
    const data = new FormData()
    data.append('resume', resumeFile)
    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: data })
      if (res.ok) { toast('Resume updated!'); setResumeFile(null) }
      else toast('Failed to upload', 'error')
    } catch { toast('Something went wrong', 'error') }
    setUploadingResume(false)
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '640px', margin: '0 auto', paddingBottom: '4rem' }} className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>Profile</h1>
        <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300 }}>Your profile info is used as the default for new resumes.</p>
      </div>

      {/* Resume upload card */}
      <div style={{ border: `1px solid ${hasResume ? '#bbf7d0' : '#e0e0e0'}`, borderRadius: '10px', padding: '1.25rem', marginBottom: '2rem', background: hasResume ? '#f0fdf4' : '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div style={{ width: '38px', height: '38px', background: hasResume ? '#dcfce7' : '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{hasResume ? '✓' : '📄'}</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Base resume (PDF)</p>
            <p style={{ fontSize: '0.8125rem', color: hasResume ? '#15803d' : '#9ca3af' }}>{hasResume ? 'Uploaded — used as context for AI suggestions' : 'No resume uploaded yet'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <label style={{ flex: 1, cursor: 'pointer' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.875rem', fontSize: '0.875rem', color: resumeFile ? '#000' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v7M4.5 4L7 1.5 9.5 4M2 11.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {resumeFile ? resumeFile.name : hasResume ? 'Replace PDF...' : 'Choose PDF file...'}
            </div>
            <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
          </label>
          <button className="btn btn-secondary btn-sm" onClick={handleResumeUpload} disabled={!resumeFile || uploadingResume} style={{ flexShrink: 0 }}>
            {uploadingResume ? <span className="spinner spinner-dark" style={{ width: '14px', height: '14px' }} /> : 'Upload'}
          </button>
        </div>
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

        <ProfileSection title="Education & training" desc="Degrees, certifications, bootcamps, or trade credentials">
          <TwoCol>
            <PRow label="Institution"><AutocompleteInput value={form.university} onChange={v => update('university', v)} placeholder="University, bootcamp, trade school..." suggestions={UNIVERSITIES} /></PRow>
            <PRow label="Degree / Certification"><input value={form.degree} onChange={e => update('degree', e.target.value)} placeholder="B.S. Computer Science, AWS Certified..." className="input" /></PRow>
          </TwoCol>
          <TwoCol>
            <PRow label="GPA / Grade (optional)"><input value={form.gpa} onChange={e => update('gpa', e.target.value)} placeholder="3.8 / 4.0" className="input" /></PRow>
            <PRow label="Graduation / Completion"><input value={form.graduationYear} onChange={e => update('graduationYear', e.target.value)} placeholder="May 2025, In progress..." className="input" /></PRow>
          </TwoCol>
          <PRow label="Relevant coursework (comma-separated)">
            <input value={form.relevantCourses} onChange={e => update('relevantCourses', e.target.value)} placeholder="Machine Learning, Corporate Finance, UX Research..." className="input" />
          </PRow>
        </ProfileSection>

        <ProfileSection title="Skills & expertise" desc="Helps AI highlight the right keywords">
          <PRow label="Specialized skills"><input value={form.languages} onChange={e => update('languages', e.target.value)} placeholder="Python, SQL, Financial modeling, Patient assessment..." className="input" /></PRow>
          <PRow label="Tools & software"><input value={form.tools} onChange={e => update('tools', e.target.value)} placeholder="Excel, Salesforce, Figma, React, Tableau, Epic EMR..." className="input" /></PRow>
          <PRow label="Domain knowledge"><input value={form.technical} onChange={e => update('technical', e.target.value)} placeholder="GAAP, Agile, HIPAA compliance, SEO, Machine Learning..." className="input" /></PRow>
          <PRow label="Soft skills"><input value={form.soft} onChange={e => update('soft', e.target.value)} placeholder="Leadership, Communication, Stakeholder management..." className="input" /></PRow>
        </ProfileSection>

        <ProfileSection title="Job preferences" desc="Guides AI on targeting the right roles">
          <TwoCol>
            <PRow label="Target role"><input value={form.targetRole} onChange={e => update('targetRole', e.target.value)} placeholder="Software Engineer" className="input" /></PRow>
            <PRow label="Experience level"><input value={form.experienceLevel} onChange={e => update('experienceLevel', e.target.value)} placeholder="Entry Level, Mid-Level, Senior..." className="input" /></PRow>
          </TwoCol>
          <TwoCol>
            <PRow label="Preferred location"><AutocompleteInput value={form.preferredLocation} onChange={v => update('preferredLocation', v)} placeholder="San Francisco, New York..." suggestions={LOCATIONS} /></PRow>
            <PRow label="Available from"><input value={form.availableFrom} onChange={e => update('availableFrom', e.target.value)} placeholder="May 2025, Immediately..." className="input" /></PRow>
          </TwoCol>
          <TwoCol>
            <PRow label="Expected salary (optional)"><input value={form.expectedSalary} onChange={e => update('expectedSalary', e.target.value)} placeholder="$120,000 – $150,000" className="input" /></PRow>
            <PRow label="Dream companies (optional)"><input value={form.targetCompanies} onChange={e => update('targetCompanies', e.target.value)} placeholder="Google, Stripe, Airbnb..." className="input" /></PRow>
          </TwoCol>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <ProfileCheck label="Open to remote" checked={form.remote} onChange={v => update('remote', v)} />
            <ProfileCheck label="Open to relocation" checked={form.openToRelocation} onChange={v => update('openToRelocation', v)} />
          </div>
        </ProfileSection>

        <div>
          <button type="submit" disabled={saving} className="btn btn-black" style={{ minWidth: '150px', height: '42px' }}>
            {saving ? <span className="spinner" /> : 'Save all changes'}
          </button>
        </div>
      </form>

    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   APPLICATIONS VIEW
────────────────────────────────────────────────────────────── */
const STATUS_LABELS = { applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' }
const STATUS_COLORS = {
  applied:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  interview: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  offer:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:  { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
}

function ApplicationsView({ toast }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

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
    <div style={{ padding: '2.5rem', maxWidth: '900px', margin: '0 auto' }} className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>Applications</h1>
        <p style={{ fontSize: '0.875rem', color: '#888', fontWeight: 300 }}>Tracked automatically when you use the Chrome extension to apply.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
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
              <div key={app._id} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', transition: 'border-color 0.12s' }}
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

                {/* Status picker */}
                <select
                  value={app.status}
                  onChange={e => updateStatus(app._id, e.target.value)}
                  style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>

                <button onClick={() => deleteApp(app._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '4px', borderRadius: '6px', display: 'flex', flexShrink: 0, transition: 'color 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                >
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   PROFILE HELPERS
────────────────────────────────────────────────────────────── */
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
function TwoCol({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>{children}</div> }
function PRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '11px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}
function ProfileCheck({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
      <div onClick={() => onChange(!checked)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: checked ? 'none' : '1.5px solid #d1d5db', background: checked ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {label}
    </label>
  )
}

/* ──────────────────────────────────────────────────────────────
   NAV HELPERS
────────────────────────────────────────────────────────────── */
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`app-nav-item${active ? ' active' : ''}`}
    >
      {icon}{label}
    </button>
  )
}

function MenuBtn({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.625rem 0.875rem', fontSize: '0.875rem', fontWeight: 500, color: danger ? '#dc2626' : '#374151', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
    >
      {children}
    </button>
  )
}

function LogoutBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#888', padding: '0.375rem 0.5rem', borderRadius: '6px', width: '100%', fontFamily: 'inherit', transition: 'all 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f5'; e.currentTarget.style.color = '#0a0a0a' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
    >
      <LogoutIcon /> Log out
    </button>
  )
}

/* ──────────────────────────────────────────────────────────────
   ICONS
────────────────────────────────────────────────────────────── */
function GridIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ClockIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4.5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 8.5v-7h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DownloadIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 11h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10M4.5 3.5V2h4v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3.5l-.75 7.5h-5.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DotsIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="3" r="1.2" fill="currentColor"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="7.5" cy="12" r="1.2" fill="currentColor"/></svg> }
function BriefcaseIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h2A1.5 1.5 0 0 1 10 3.5V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1.5 9h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function BoltIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.5 1.5L3 8.5h4l-1 5 5.5-7H8L8.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
