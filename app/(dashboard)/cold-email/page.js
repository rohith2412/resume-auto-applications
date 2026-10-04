'use client'

import dynamic from 'next/dynamic'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// ─── icons ────────────────────────────────────────────────────
function BoltIcon() { return <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="currentColor"><path d="M160-120v-200q0-33 23.5-56.5T240-400h480q33 0 56.5 23.5T800-320v200H160Zm200-320q-83 0-141.5-58.5T160-640q0-83 58.5-141.5T360-840h240q83 0 141.5 58.5T800-640q0 83-58.5 141.5T600-440H360ZM240-200h480v-120H240v120Zm120-320h240q50 0 85-35t35-85q0-50-35-85t-85-35H360q-50 0-85 35t-35 85q0 50 35 85t85 35Zm28.5-91.5Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm240 0Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5ZM480-200Zm0-440Z"/></svg> }
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function MailIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 4.5L7.5 8.5L13.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }

const NAV = [
  { id: 'auto-apply',   label: 'Auto Apply',   href: '/auto-apply',   icon: <BoltIcon /> },
  { id: 'cold-email',   label: 'Cold Email',   href: '/cold-email',   icon: <MailIcon /> },
  { id: 'profile',      label: 'Profile',      href: '/profile',      icon: <UserIcon /> },
]

// ─── shell ────────────────────────────────────────────────────
function Shell({ user, children }) {
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ds,.ds button,.ds input,.ds textarea,.ds select{font-family:'DM Sans','Inter',sans-serif;-webkit-font-smoothing:antialiased}
        .nav-link{display:flex;align-items:center;gap:.625rem;padding:.5rem .75rem;font-size:.875rem;font-weight:500;border-radius:6px;cursor:pointer;transition:all .12s;background:transparent;border:none;width:100%;text-align:left;color:#888;margin-bottom:2px;text-decoration:none}
        .nav-link:hover,.nav-link.active{background:#f7f7f5;color:#0a0a0a}
        .animate-fade{animation:fade-in .25s ease}
        @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>

      <div className="ds" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
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

        {isMobile && (
          <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e0e0e0', padding: '.5rem .25rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {NAV.map(n => (
              <Link key={n.id} href={n.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '.4rem .5rem', borderRadius: 8, color: isActive(n.href) ? '#0a0a0a' : '#aaa', fontSize: 10, fontWeight: 500, textDecoration: 'none', flex: 1, transition: 'all .12s' }}>
                {n.icon}<span>{n.label}</span>
              </Link>
            ))}
          </nav>
        )}

        <main style={{ marginLeft: isMobile ? 0 : 224, flex: 1, minHeight: '100vh', paddingBottom: isMobile ? '5.5rem' : 0 }}>
          {children}
        </main>
      </div>

      {showLogout && (
        <div onClick={() => setShowLogout(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,.12)', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}><LogoutIcon /></div>
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Log out?</h3>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.75rem' }}>You&apos;ll be signed out. Any unsaved changes will be lost.</p>
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

// ─── pipeline stages config ──────────────────────────────────
const STAGES = [
  { id: 'searching',  label: 'Searching Jobs',   icon: '1' },
  { id: 'extracting', label: 'Finding Emails',    icon: '2' },
  { id: 'generating', label: 'Crafting Emails',   icon: '3' },
  { id: 'ready',      label: 'Ready to Send',     icon: '4' },
]

const STAGE_ORDER = ['idle', 'searching', 'extracting', 'generating', 'ready', 'done', 'error']

function stageIndex(stage) {
  return STAGE_ORDER.indexOf(stage)
}

// ─── pipeline step component ─────────────────────────────────
function PipelineStep({ stage, currentStage, label, icon, isLast }) {
  const current = stageIndex(currentStage)
  const mine = stageIndex(stage)
  const isDone = current > mine || currentStage === 'done'
  const isActive = currentStage === stage
  const isPending = current < mine

  let bg = '#f3f4f6'
  let color = '#bbb'
  let borderColor = '#e5e5e5'
  let lineColor = '#e5e5e5'

  if (isDone) { bg = '#0a0a0a'; color = '#fff'; borderColor = '#0a0a0a'; lineColor = '#0a0a0a' }
  else if (isActive) { bg = '#fff'; color = '#0a0a0a'; borderColor = '#0a0a0a'; lineColor = '#e5e5e5' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: bg, color, border: `2px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, transition: 'all .3s',
          position: 'relative',
        }}>
          {isDone ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : icon}
          {isActive && (
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: '2px solid #0a0a0a', opacity: 0.3,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: isActive || isDone ? 600 : 400,
          color: isActive || isDone ? '#0a0a0a' : '#aaa',
          textAlign: 'center', lineHeight: 1.3, transition: 'all .3s',
        }}>{label}</span>
      </div>
      {!isLast && (
        <div style={{
          flex: 1, height: 2, background: lineColor,
          margin: '0 8px', marginBottom: 22, transition: 'background .3s',
        }} />
      )}
    </div>
  )
}

// ─── cold email view ─────────────────────────────────────────
function ColdEmail({ user }) {
  const [form, setForm] = useState({
    fullName: user?.profile?.fullName || '',
    email: user?.email || '',
    linkedin: user?.profile?.linkedin || '',
    keywords: user?.jobPreferences?.keywords || user?.jobPreferences?.targetRole || '',
    location: user?.jobPreferences?.searchLocation || user?.profile?.location || '',
    coverLetter: '',
    gmailAppPassword: user?.hasGmailAppPassword ? '••••••••••••••••' : '',
  })
  React.useEffect(() => {
    if (!user) return
    setForm(f => ({
      ...f,
      fullName: user.profile?.fullName || f.fullName,
      email: user.email || f.email,
      linkedin: user.profile?.linkedin || f.linkedin,
      keywords: user.jobPreferences?.keywords || user.jobPreferences?.targetRole || f.keywords,
      location: user.jobPreferences?.searchLocation || user.profile?.location || f.location,
      gmailAppPassword: user.hasGmailAppPassword ? '••••••••••••••••' : f.gmailAppPassword,
    }))
    setHasResume(!!user.resumeText)
    setResumeFilename(user.resumeFilename || '')
  }, [user])
  const [timeRange, setTimeRange] = useState('7d')
  const [resumeFile, setResumeFile] = useState(null)
  const [hasResume, setHasResume] = useState(!!user?.resumeText)
  const [resumeFilename, setResumeFilename] = useState(user?.resumeFilename || '')
  const [uploadingResume, setUploadingResume] = useState(false)
  const [running, setRunning] = useState(false)
  const [currentStage, setCurrentStage] = useState('idle')
  const [stageMessage, setStageMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])
  const [jobsFound, setJobsFound] = useState(0)
  const [emailsFound, setEmailsFound] = useState(0)
  const [emailsGenerated, setEmailsGenerated] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [formError, setFormError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const fileInputRef = useRef(null)
  const logRef = useRef(null)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load saved cold emails on mount
  useEffect(() => {
    fetch('/api/cold-email').then(r => r.json()).then(d => {
      if (d.emails?.length > 0) {
        const mapped = d.emails.map(e => ({
          id: e._id,
          url: e.jobUrl,
          title: e.jobTitle,
          role: e.jobTitle,
          emails: [e.recipientEmail],
          subject: e.subject,
          body: e.body,
          status: e.status,
          sentAt: e.sentAt,
          createdAt: e.createdAt,
        }))
        setResults(mapped)
        setSelectedEmail(mapped[0])
        setCurrentStage('done')
        setEmailsGenerated(mapped.length)
      }
    }).catch(() => {})
  }, [])

  const set = key => e => { setForm(f => ({ ...f, [key]: typeof e === 'string' ? e : e.target.value })); setFormError('') }

  async function handleResumeUpload() {
    if (!resumeFile) return
    setUploadingResume(true)
    const fd = new FormData()
    fd.append('resume', resumeFile)
    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) { setHasResume(true); setResumeFilename(resumeFile.name); setResumeFile(null) }
      else setFormError(data.error || 'Upload failed')
    } catch { setFormError('Resume upload failed') }
    finally { setUploadingResume(false) }
  }

  async function startPipeline() {
    if (!form.keywords.trim()) { setFormError('Job title is required.'); return }
    if (!form.location.trim()) { setFormError('Location is required.'); return }
    if (!form.fullName.trim()) { setFormError('Your name is required.'); return }

    // Upload resume first if one is selected
    if (resumeFile) {
      await handleResumeUpload()
    }

    setFormError('')
    setRunning(true)
    setCurrentStage('searching')
    setStageMessage('Starting pipeline...')
    setProgress(0)
    setResults([])
    setJobsFound(0)
    setEmailsFound(0)
    setEmailsGenerated(0)
    setLogs([])
    setExpandedId(null)

    try {
      const res = await fetch('/api/cold-email/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, ...form }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setCurrentStage('error')
        setStageMessage(data.error || 'Pipeline failed')
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            setCurrentStage(data.stage)
            if (data.message) {
              setStageMessage(data.message)
              setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: data.message }])
            }
            if (data.progress) setProgress(data.progress)
            if (data.count !== undefined) setJobsFound(data.count)
            if (data.found !== undefined) setEmailsFound(data.found)
            if (data.totalWithEmails !== undefined) setEmailsFound(data.totalWithEmails)
            if (data.generated !== undefined) setEmailsGenerated(data.generated)
            if (data.results) {
              setResults(data.results)
              if (data.results.length > 0 && !selectedEmail) setSelectedEmail(data.results[0])
            }
          } catch {}
        }
      }
    } catch (err) {
      setCurrentStage('error')
      setStageMessage('Connection lost. Try again.')
    }

    setRunning(false)
  }

  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')

  function buildBody(result) {
    let body = result.body
    if (user?.resumeUrl) body += `\n\nResume: ${user.resumeUrl}`
    if (form.linkedin) body += `\nLinkedIn: ${form.linkedin}`
    return body
  }

  function markLocalSent(id) {
    setResults(prev => prev.map(r => r.id === id ? { ...r, status: 'sent' } : r))
    if (selectedEmail?.id === id) setSelectedEmail(s => ({ ...s, status: 'sent' }))
  }

  async function sendEmails(ids) {
    setSending(true)
    const est = ids.length > 1 ? ` (~${ids.length * 3}s)` : ''
    setSendStatus(`Sending ${ids.length} email${ids.length > 1 ? 's' : ''}${est}...`)
    try {
      const res = await fetch('/api/cold-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, linkedin: form.linkedin }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSendStatus(data.error || 'Send failed')
        setSending(false)
        return
      }

      for (const r of data.results) {
        if (r.success) markLocalSent(r.id)
      }

      if (data.failed > 0) {
        const errMsg = data.results.find(r => !r.success)?.error || 'Some emails failed'
        setSendStatus(`Sent ${data.sent}, failed ${data.failed}: ${errMsg}`)
      } else {
        setSendStatus(`${data.sent} email${data.sent > 1 ? 's' : ''} sent successfully!`)
      }
    } catch (err) {
      setSendStatus('Network error. Try again.')
    }
    setSending(false)
    setTimeout(() => setSendStatus(''), 5000)
  }

  function sendAll() {
    const unsent = results.filter(r => r.status !== 'sent')
    if (unsent.length === 0) return
    sendEmails(unsent.map(r => r.id))
  }

  function sendOne(result) {
    sendEmails([result.id])
  }

  function copyEmail(result) {
    const text = `To: ${result.emails[0] || ''}\nSubject: ${result.subject}\n\n${buildBody(result)}`
    navigator.clipboard.writeText(text)
  }

  const timeOptions = [
    { value: '24h', label: 'Past 24 hours' },
    { value: '7d',  label: 'Past 7 days' },
    { value: '30d', label: 'Past 30 days' },
  ]

  const INP = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e8e8e8', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0a0a0a', background: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }

  return (
    <div className="animate-fade" style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2.5rem' }}>

      {/* Header */}
      <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6, lineHeight: 1.2 }}>
        Cold <em style={{ fontStyle: 'italic', color: '#888' }}>Email.</em>
      </h1>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20, fontWeight: 300, lineHeight: 1.6 }}>
        AI searches for jobs, finds hiring emails, and drafts personalized cold emails for you.
      </p>

      {/* Profile summary + edit button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setShowProfileModal(true)}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            border: '1.5px solid #e5e5e5', background: '#fff', color: '#0a0a0a',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg>
          {form.fullName ? 'Edit Profile' : 'Add Profile'}
        </button>
        {form.fullName && (
          <span style={{ fontSize: 12, color: '#888' }}>
            {form.fullName}{form.keywords ? ` - ${form.keywords}` : ''}{form.location ? ` in ${form.location}` : ''}
          </span>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowProfileModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '20px' : '32px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Your Details</h2>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', padding: 4 }}>&times;</button>
            </div>

            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Full Name *</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Your Name" style={INP}
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Email</label>
                <input value={form.email} style={{ ...INP, background: '#f9fafb', color: '#888' }} disabled />
              </div>
            </div>

            {/* Job Title + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Job Title *</label>
                <input value={form.keywords} onChange={set('keywords')} placeholder="Software Engineer" style={INP}
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Location *</label>
                <input value={form.location} onChange={set('location')} placeholder="Toronto, Canada" style={INP}
                  onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </div>
            </div>

            {/* LinkedIn */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>LinkedIn URL</label>
              <input value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/yourname" style={INP}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
            </div>

            {/* Resume */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Resume (PDF)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    if (f.type !== 'application/pdf') { setFormError('Only PDF files.'); return }
                    if (f.size > 5 * 1024 * 1024) { setFormError('Max 5 MB.'); return }
                    setResumeFile(f); setFormError('')
                  }}
                />
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, border: `1.5px solid ${hasResume ? '#bbf7d0' : '#e8e8e8'}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer', background: hasResume ? '#f0fdf4' : '#fff', color: hasResume ? '#15803d' : '#9ca3af' }}
                >
                  {resumeFile ? resumeFile.name : hasResume ? `${resumeFilename || 'Resume uploaded'} - click to replace` : 'Choose PDF file...'}
                </div>
                {resumeFile && (
                  <button onClick={handleResumeUpload} disabled={uploadingResume}
                    style={{ padding: '9px 14px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploadingResume ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploadingResume ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  >{uploadingResume ? 'Uploading...' : 'Upload'}</button>
                )}
              </div>
            </div>

            {/* Cover letter */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Cover Letter / Extra Context</label>
              <textarea value={form.coverLetter} onChange={set('coverLetter')} rows={3}
                placeholder="Optional - anything extra you want mentioned in the cold emails..."
                style={{ ...INP, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'} onBlur={e => e.target.style.borderColor = '#e8e8e8'}
              />
            </div>

            {/* Gmail App Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>Gmail App Password *</label>
              <input
                type="password"
                value={form.gmailAppPassword}
                onChange={e => setForm(f => ({ ...f, gmailAppPassword: e.target.value }))}
                placeholder="xxxx xxxx xxxx xxxx"
                style={INP}
                onFocus={e => { e.target.style.borderColor = '#0a0a0a'; if (form.gmailAppPassword.includes('•')) setForm(f => ({ ...f, gmailAppPassword: '' })) }}
                onBlur={e => e.target.style.borderColor = '#e8e8e8'}
              />
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4, lineHeight: 1.5 }}>
                Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Google App Passwords</a> → create one for "Mail" → paste the 16-char code here. Requires 2FA enabled.
              </div>
            </div>

            {formError && (
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{formError}</div>
            )}

            <button onClick={async () => {
                if (!form.fullName || !form.keywords || !form.location) { setFormError('Fill in name, job title, and location.'); return }
                setFormError(''); setShowProfileModal(false)
                const patchData = {
                  fullName: form.fullName, location: form.location, linkedin: form.linkedin,
                  keywords: form.keywords, searchLocation: form.location, targetRole: form.keywords,
                }
                if (form.gmailAppPassword && !form.gmailAppPassword.includes('•')) {
                  patchData.gmailAppPassword = form.gmailAppPassword.replace(/\s/g, '')
                }
                console.log('[cold-email] patchData:', JSON.stringify(patchData), 'hasGmailPw:', !!patchData.gmailAppPassword)
                try {
                  const res = await fetch('/api/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patchData),
                  })
                  if (res.ok) {
                    const me = await fetch('/api/auth/me').then(r => r.json())
                    if (me.user) setUser(me.user)
                  }
                } catch {}
              }}
              style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Save</button>
          </div>
        </div>
      )}

      {/* Empty state hero */}
      {currentStage === 'idle' && results.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: isMobile ? '2.5rem 1.5rem' : '3.5rem 2rem', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 8l9 6 9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>Find hiring managers and reach out</h2>
          <p style={{ fontSize: 13, color: '#888', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.6 }}>
            AI will search for {form.keywords || 'jobs'}{form.location ? ` in ${form.location}` : ''}, find contact emails, and draft personalized cold emails - ready to send.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {timeOptions.map(opt => (
              <button key={opt.value} onClick={() => setTimeRange(opt.value)}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 500, borderRadius: 8,
                  border: `1.5px solid ${timeRange === opt.value ? '#0a0a0a' : '#e5e5e5'}`,
                  background: timeRange === opt.value ? '#0a0a0a' : '#fff',
                  color: timeRange === opt.value ? '#fff' : '#666',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                }}
              >{opt.label}</button>
            ))}
          </div>
          <button
            onClick={() => { if (!form.fullName || !form.keywords) { setShowProfileModal(true); return } startPipeline() }}
            style={{
              padding: '12px 36px', background: '#0a0a0a', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-.01em',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            Start Pipeline
          </button>
        </div>
      )}

      {/* Compact controls when pipeline has run or has saved emails */}
      {currentStage !== 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {timeOptions.map(opt => (
            <button key={opt.value} onClick={() => !running && setTimeRange(opt.value)}
              style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 500, borderRadius: 6,
                border: `1.5px solid ${timeRange === opt.value ? '#0a0a0a' : '#e5e5e5'}`,
                background: timeRange === opt.value ? '#0a0a0a' : '#fff',
                color: timeRange === opt.value ? '#fff' : '#666',
                cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                transition: 'all .15s', opacity: running ? 0.5 : 1,
              }}
            >{opt.label}</button>
          ))}
          <button
            onClick={() => { if (!form.fullName || !form.keywords) { setShowProfileModal(true); return } startPipeline() }}
            disabled={running}
            style={{
              marginLeft: 'auto', padding: '7px 20px', background: running ? '#555' : '#0a0a0a', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {running ? (
              <>
                <span style={{ width: 12, height: 12, border: '2px solid #ffffff44', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                Running...
              </>
            ) : 'Run Again'}
          </button>
        </div>
      )}

      {/* Pipeline progress */}
      {currentStage !== 'idle' && (
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          {/* Compact pipeline steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
            {STAGES.map((s, i) => {
              const order = ['searching', 'extracting', 'generating', 'ready']
              const mine = order.indexOf(s.id)
              const current = order.indexOf(currentStage === 'done' ? 'ready' : currentStage === 'error' ? 'searching' : currentStage)
              const isDone = current > mine
              const isActive = current === mine
              return (
                <React.Fragment key={s.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                      background: isDone ? '#0a0a0a' : isActive ? '#fff' : '#f3f4f6',
                      color: isDone ? '#fff' : isActive ? '#0a0a0a' : '#bbb',
                      border: `1.5px solid ${isDone || isActive ? '#0a0a0a' : '#e5e5e5'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isDone ? <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : s.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: isDone || isActive ? 600 : 400, color: isDone || isActive ? '#0a0a0a' : '#aaa' }}>{s.label}</span>
                  </div>
                  {i < STAGES.length - 1 && <div style={{ flex: 1, height: 1.5, background: isDone ? '#0a0a0a' : '#e5e5e5', margin: '0 6px' }} />}
                </React.Fragment>
              )
            })}
          </div>

          {/* Status + progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: currentStage === 'error' ? '#dc2626' : '#555', fontWeight: 500 }}>
            {running && <span style={{ width: 12, height: 12, border: '2px solid #d1d5db', borderTopColor: '#0a0a0a', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{stageMessage}</span>
            {currentStage !== 'idle' && (
              <span style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 600 }}>
                <span style={{ color: '#2563eb' }}>{jobsFound} jobs</span>
                <span style={{ color: '#d97706' }}>{emailsFound} emails</span>
                <span style={{ color: '#16a34a' }}>{emailsGenerated} ready</span>
              </span>
            )}
          </div>
          {progress > 0 && running && (
            <div style={{ marginTop: 6, height: 3, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 3, width: `${progress}%`, transition: 'width .3s' }} />
            </div>
          )}
        </div>
      )}

      {/* Activity log */}
      {logs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Activity Log</div>
          <div ref={logRef} style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px 16px', maxHeight: 160, overflowY: 'auto', fontFamily: 'monospace' }}>
            {logs.map((l, i) => (
              <div key={i} style={{ fontSize: 11.5, color: '#a3a3a3', marginBottom: 3, lineHeight: 1.5 }}>
                <span style={{ color: '#555' }}>{l.time}</span>{' '}
                <span style={{ color: '#e5e5e5' }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results: list left, email preview right */}
      {results.length > 0 && (
        <>
        {/* Send All bar */}
        {results.some(r => r.status !== 'sent') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '10px 16px', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#555' }}>
              {results.filter(r => r.status !== 'sent').length} email{results.filter(r => r.status !== 'sent').length > 1 ? 's' : ''} ready to send
              {user?.resumeUrl && <span style={{ color: '#16a34a', marginLeft: 6, fontSize: 11 }}> - resume link included</span>}
            </span>
            <button onClick={sendAll} disabled={sending}
              style={{ padding: '8px 20px', background: sending ? '#555' : '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {sending ? (
                <><span style={{ width: 12, height: 12, border: '2px solid #ffffff44', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Sending...</>
              ) : (
                <><MailIcon /> Send All</>
              )}
            </button>
          </div>
        )}
        {sendStatus && (
          <div style={{ background: sendStatus.includes('fail') || sendStatus.includes('error') || sendStatus.includes('expired') ? '#fff5f5' : '#f0fdf4', border: `1px solid ${sendStatus.includes('fail') || sendStatus.includes('error') || sendStatus.includes('expired') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: sendStatus.includes('fail') || sendStatus.includes('error') || sendStatus.includes('expired') ? '#dc2626' : '#15803d', marginBottom: 14 }}>{sendStatus}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left: email list */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
              Generated Emails ({results.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(r => {
                const selected = selectedEmail?.id === r.id
                return (
                  <div key={r.id}
                    onClick={() => setSelectedEmail(r)}
                    style={{
                      border: `1.5px solid ${selected ? '#0a0a0a' : '#e0e0e0'}`, borderRadius: 12,
                      background: selected ? '#fafafa' : '#fff', padding: '12px 14px',
                      cursor: 'pointer', transition: 'all .12s',
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#bbb' }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#e0e0e0' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-.01em', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.role || r.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#888' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.emails[0]}</span>
                      <span style={{
                        background: r.status === 'sent' ? '#eff6ff' : '#f0fdf4',
                        color: r.status === 'sent' ? '#2563eb' : '#16a34a',
                        border: `1px solid ${r.status === 'sent' ? '#bfdbfe' : '#bbf7d0'}`,
                        borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0,
                      }}>{r.status === 'sent' ? 'Sent' : 'Ready'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: email preview (desktop) / expanded inline (mobile) */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: 24 }}>
            {selectedEmail ? (
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Email Preview</div>
                  <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-.01em', marginBottom: 4 }}>
                    {selectedEmail.role || selectedEmail.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selectedEmail.emails[0]}</span>
                    <a href={selectedEmail.url} target="_blank" rel="noreferrer"
                      style={{ color: '#aaa', textDecoration: 'none', fontSize: 11 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >View source</a>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>To</div>
                    <div style={{ fontSize: 13, color: '#0a0a0a' }}>{selectedEmail.emails[0]}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Subject</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a' }}>{selectedEmail.subject}</div>
                  </div>
                </div>

                <div style={{ padding: '16px 18px' }}>
                  <pre style={{ fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedEmail.body}</pre>
                </div>

                <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                  <button onClick={() => sendOne(selectedEmail)} disabled={sending}
                    style={{ flex: 1, padding: '10px 14px', background: sending ? '#555' : selectedEmail.status === 'sent' ? '#f3f4f6' : '#0a0a0a', color: selectedEmail.status === 'sent' ? '#888' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  ><MailIcon /> {sending ? 'Sending...' : selectedEmail.status === 'sent' ? 'Resend' : 'Send'}</button>
                  <button onClick={() => copyEmail(selectedEmail)}
                    style={{ padding: '10px 14px', background: '#fff', color: '#0a0a0a', border: '1px solid #e8e8e8', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Copy</button>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed #e8e8e8', borderRadius: 14, padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <MailIcon />
                </div>
                <p style={{ fontSize: 13, color: '#aaa', fontWeight: 400, lineHeight: 1.6 }}>
                  Click an email to preview it here.
                </p>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────
function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user)
      else router.push('/')
    }).catch(() => router.push('/'))
  }, [router])

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div style={{ width: 18, height: 18, border: '2px solid #e5e5e5', borderTopColor: '#888', borderRadius: '50%', animation: 'spin .6s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <Shell user={user}>
      <ColdEmail user={user} />
    </Shell>
  )
}

const AppClient = dynamic(() => Promise.resolve({ default: App }), { ssr: false })
export default function Page() { return <AppClient /> }
