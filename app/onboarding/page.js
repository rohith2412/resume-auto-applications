'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Location autocomplete suggestions ─────────────────────────
const LOCATIONS = [
  'New York, NY','Los Angeles, CA','Chicago, IL','Houston, TX','Phoenix, AZ',
  'San Francisco, CA','Seattle, WA','Denver, CO','Austin, TX','Boston, MA',
  'Washington, DC','Atlanta, GA','Dallas, TX','Miami, FL','San Diego, CA',
  'Portland, OR','Nashville, TN','Minneapolis, MN','Raleigh, NC','Charlotte, NC',
  'Salt Lake City, UT','Orlando, FL','Tampa, FL','Detroit, MI','Philadelphia, PA',
  'Remote','Hybrid','Open to relocation',
  'Toronto, Canada','Vancouver, Canada','Montreal, Canada','London, UK',
  'Sydney, Australia','Melbourne, Australia','Dublin, Ireland','Berlin, Germany',
  'Amsterdam, Netherlands','Singapore','Zurich, Switzerland','Paris, France',
]

// ── Field options ─────────────────────────────────────────────
const FIELDS = [
  'Software Engineering','Data Science','Product Management','Design / UX',
  'Marketing','Sales','Finance / Accounting','Operations','Human Resources',
  'Customer Success','Healthcare','Legal','Education','Consulting',
  'Mechanical Engineering','Electrical Engineering','Civil Engineering',
  'Business Analytics','Project Management','Other',
]

const EXP_OPTIONS = [
  { value: '0',  label: '0 years (student / new grad)' },
  { value: '1',  label: '1 year' },
  { value: '2',  label: '2 years' },
  { value: '3',  label: '3 years' },
  { value: '4',  label: '4 years' },
  { value: '5',  label: '5 years' },
  { value: '6',  label: '6–8 years' },
  { value: '9',  label: '9–12 years' },
  { value: '13', label: '13+ years' },
]

// ── Autocomplete input ────────────────────────────────────────
function LocationInput({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const ref = useRef(null)

  const filtered = value.trim().length === 0
    ? LOCATIONS.slice(0, 8)
    : LOCATIONS.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)

  useEffect(() => {
    function click(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  function handleKey(e) {
    if (!open) { if (e.key === 'ArrowDown') setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && hi >= 0) { e.preventDefault(); onChange(filtered[hi]); setOpen(false); setHi(-1) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="input"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHi(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder="e.g. San Francisco, CA"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 200,
          overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map((s, i) => (
            <div key={s}
              onMouseDown={() => { onChange(s); setOpen(false); setHi(-1) }}
              onMouseEnter={() => setHi(i)}
              style={{
                padding: '.5rem .875rem', fontSize: '.875rem', cursor: 'pointer',
                background: i === hi ? '#f3f4f6' : '#fff', color: '#111',
                transition: 'background .1s',
                borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main onboarding page ──────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [field, setField] = useState('')
  const [experience, setExperience] = useState('')
  const [location, setLocation] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeName, setResumeName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState(1) // 1=field, 2=experience, 3=location, 4=resume
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const fileInputRef = useRef(null)

  // If already onboarded, skip straight to dashboard
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user) { router.replace('/'); return }
        if (d.user.onboardingComplete) { router.replace('/auto-apply'); return }
        // Pre-fill from existing data if any
        if (d.user.jobPreferences?.targetRole) setField(d.user.jobPreferences.targetRole)
        if (d.user.jobPreferences?.yearsExp) setExperience(d.user.jobPreferences.yearsExp)
        if (d.user.profile?.location) setLocation(d.user.profile.location)
        setLoaded(true)
      })
      .catch(() => router.replace('/'))
  }, [router])

  async function handleSubmit() {
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, experience, location: location.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setSaving(false); return }
      router.replace('/auto-apply')
    } catch {
      setError('Something went wrong. Try again.')
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ width: 18, height: 18, border: '2px solid #e5e5e5', borderTopColor: '#888', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/icon.svg" alt="reblet" width={48} height={48} style={{ display: 'block', margin: '0 auto 12px', borderRadius: 12 }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em', margin: 0 }}>
            {step === 1 && 'What do you do?'}
            {step === 2 && 'How experienced are you?'}
            {step === 3 && 'Where are you based?'}
            {step === 4 && 'Upload your resume'}
          </h1>
          <p style={{ fontSize: '.875rem', color: '#888', marginTop: 6, fontWeight: 400 }}>
            Step {step} of 4
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ height: 3, background: '#ebebeb', borderRadius: 3, marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 3, width: `${(step / 4) * 100}%`, transition: 'width .3s ease' }} />
        </div>

        {/* ── Step card ── */}
        <div style={{
          background: '#fff', border: '1px solid #ebebeb', borderRadius: 14,
          padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,.04)',
        }}>

          {/* Step 1: Field */}
          {step === 1 && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Field
              </label>
              <select
                className="input"
                value={field}
                onChange={e => { setField(e.target.value); setError('') }}
                style={{ appearance: 'none', cursor: 'pointer', marginBottom: '1.5rem' }}
                autoFocus
              >
                <option value="" disabled>Select your field</option>
                {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Experience
              </label>
              <select
                className="input"
                value={experience}
                onChange={e => { setExperience(e.target.value); setError('') }}
                style={{ appearance: 'none', cursor: 'pointer', marginBottom: '1.5rem' }}
                autoFocus
              >
                <option value="" disabled>Years of experience</option>
                {EXP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Location
              </label>
              <LocationInput value={location} onChange={v => { setLocation(v); setError('') }} />
            </div>
          )}

          {/* Step 4: Resume upload */}
          {step === 4 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Resume (PDF)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
                  if (f.size > 5 * 1024 * 1024) { setError('File too large - max 5 MB.'); return }
                  setResumeFile(f)
                  setResumeName(f.name)
                  setError('')
                }}
                style={{ display: 'none' }}
              />

              {/* Drop zone / file picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#0a0a0a' }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#ddd' }}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = '#ddd'
                  const f = e.dataTransfer.files?.[0]
                  if (!f) return
                  if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
                  if (f.size > 5 * 1024 * 1024) { setError('File too large - max 5 MB.'); return }
                  setResumeFile(f)
                  setResumeName(f.name)
                  setError('')
                }}
                style={{
                  border: '2px dashed #ddd', borderRadius: 12, padding: '2rem 1.5rem',
                  textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s',
                  background: resumeFile ? '#f0fdf4' : '#fafafa',
                }}
              >
                {resumeFile ? (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{resumeName}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Click to replace</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#555' }}>
                      Drop your resume here or <span style={{ color: '#0a0a0a', textDecoration: 'underline', textUnderlineOffset: 2 }}>browse</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>PDF only, max 5 MB</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 13px', fontSize: 13, color: '#b91c1c', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep(s => s - 1); setError('') }}
                style={{
                  padding: '13px 20px', fontSize: 14, fontWeight: 500,
                  borderRadius: 10, border: '1px solid #e5e5e5', cursor: 'pointer',
                  background: '#fff', color: '#555', letterSpacing: '-0.01em',
                }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              disabled={saving || uploading}
              onClick={async () => {
                if (step === 1 && !field) { setError('Please select your field.'); return }
                if (step === 2 && !experience) { setError('Please select your experience.'); return }
                if (step === 3 && !location.trim()) { setError('Please enter your location.'); return }
                if (step === 4 && !resumeFile) { setError('Please upload your resume to continue.'); return }
                setError('')
                if (step < 4) { setStep(s => s + 1); return }

                // Step 4: upload resume then save onboarding
                setUploading(true)
                try {
                  const fd = new FormData()
                  fd.append('resume', resumeFile)
                  const uploadRes = await fetch('/api/resume/upload', { method: 'POST', body: fd })
                  const uploadData = await uploadRes.json()
                  if (!uploadRes.ok) { setError(uploadData.error || 'Upload failed'); setUploading(false); return }
                  try {
                    const reader = new FileReader()
                    reader.onload = () => { try { localStorage.setItem('resume_pdf', reader.result) } catch {} }
                    reader.readAsDataURL(resumeFile)
                  } catch {}
                } catch {
                  setError('Upload failed. Try again.')
                  setUploading(false)
                  return
                }
                setUploading(false)
                handleSubmit()
              }}
              style={{
                flex: 1, padding: '13px 0', fontSize: 14, fontWeight: 600,
                borderRadius: 10, border: 'none',
                cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                background: '#0a0a0a', color: '#fff', letterSpacing: '-0.01em',
                opacity: (saving || uploading) ? 0.6 : 1, transition: 'opacity .15s',
              }}
            >
              {uploading ? 'Uploading…' : saving ? 'Saving…' : step === 4 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: '1.25rem' }}>
          You can update these anytime from your profile.
        </p>
      </div>
    </div>
  )
}
