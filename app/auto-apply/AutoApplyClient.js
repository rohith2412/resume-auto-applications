'use client'

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
//  Tiny shared sub-components
// ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: '11px', color: '#bbb' }}>{hint}</span>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        fontSize: '10px', fontWeight: 700, color: '#aaa',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        borderBottom: '1px solid #f0f0f0', paddingBottom: '7px', marginBottom: '16px',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

const INPUT_STYLE = {
  width: '100%', boxSizing: 'border-box',
  border: '1.5px solid #e8e8e8', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px',
  color: '#0a0a0a', background: '#fff', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
  appearance: 'auto', WebkitAppearance: 'auto',
}

function Input({ value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...INPUT_STYLE, borderColor: focused ? '#0a0a0a' : '#e8e8e8' }}
      {...props}
    />
  )
}

function Select({ value, onChange, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...INPUT_STYLE, borderColor: focused ? '#0a0a0a' : '#e8e8e8', cursor: 'pointer' }}
      {...props}
    >
      {children}
    </select>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function AutoApplyClient({ user }) {
  const jp = user.jobPreferences || {}

  const [form, setForm] = useState({
    keywords:         jp.keywords         || '',
    searchLocation:   jp.searchLocation   || '',
    workType:         jp.workType         || '',
    linkedinExpLevel: jp.linkedinExpLevel || '',
  })

  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState('')
  const [apiKey, setApiKey]               = useState(user.apiKey || '')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copied, setCopied]               = useState(false)

  useEffect(() => {
    fetch('/api/extension/generate-key')
      .then(r => r.json())
      .then(d => { if (d.apiKey) setApiKey(d.apiKey) })
      .catch(() => {})
  }, [])

  function set(key) { return val => setForm(f => ({ ...f, [key]: val })) }

  async function generateKey() {
    setGeneratingKey(true)
    try {
      const res = await fetch('/api/extension/generate-key', { method: 'POST' })
      const data = await res.json()
      if (data.apiKey) setApiKey(data.apiKey)
    } finally {
      setGeneratingKey(false)
    }
  }

  function copyKey() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.keywords || !form.searchLocation) {
      setError('Please fill in Job Title to Search and Search Location.')
      return
    }
    setError(''); setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/auto-apply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords:         form.keywords,
          searchLocation:   form.searchLocation,
          workType:         form.workType,
          linkedinExpLevel: form.linkedinExpLevel,
        }),
      })
      if (!res.ok) { setError('Failed to save. Try again.'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

      {/* ── Left: Job Search Form ── */}
      <form onSubmit={handleSave}>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.2 }}>
          Auto <em style={{ fontStyle: 'italic', color: '#888' }}>Apply.</em>
        </h1>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 28, fontWeight: 300, lineHeight: 1.6 }}>
          Set your job search preferences. The extension uses these to filter LinkedIn and auto-fill every Easy Apply form.
        </p>

        <Section title="LinkedIn Job Search">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Job Title to Search *" hint="e.g. Software Engineer Intern">
              <Input value={form.keywords} onChange={set('keywords')} placeholder="Software Engineer Intern" required />
            </Field>
            <Field label="Search Location *" hint="e.g. Canada, Toronto, Remote">
              <Input value={form.searchLocation} onChange={set('searchLocation')} placeholder="Canada" required />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Work Type">
              <Select value={form.workType} onChange={set('workType')}>
                <option value="">Any</option>
                <option value="2">Remote</option>
                <option value="3">Hybrid</option>
                <option value="1">On-site</option>
              </Select>
            </Field>
            <Field label="Experience Level">
              <Select value={form.linkedinExpLevel} onChange={set('linkedinExpLevel')}>
                <option value="">Any</option>
                <option value="1">Internship</option>
                <option value="2">Entry Level</option>
                <option value="3">Associate</option>
                <option value="4">Mid-Senior</option>
              </Select>
            </Field>
          </div>
        </Section>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%', padding: '12px 20px',
            background: saved ? '#16a34a' : '#0a0a0a',
            color: '#fff', border: 'none', borderRadius: 9,
            fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em', transition: 'background 0.2s',
            opacity: saving ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* ── Right: Extension Card ── */}
      <div style={{ position: 'sticky', top: 24 }}>

        {/* Search preview */}
        {(form.keywords || form.searchLocation) && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Search Preview
            </div>
            <p style={{ fontSize: 12.5, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>
              <strong style={{ color: '#0a0a0a' }}>{form.keywords || '—'}</strong>
              {form.searchLocation && <> in {form.searchLocation}</>}
              {(form.workType || form.linkedinExpLevel) && (
                <span style={{ color: '#aaa' }}> · {[wtLabel[form.workType], elLabel[form.linkedinExpLevel]].filter(Boolean).join(' · ')}</span>
              )}
            </p>
            <button
              type="button"
              onClick={openLinkedIn}
              style={{
                width: '100%', padding: '9px 10px',
                background: '#0a66c2', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Open on LinkedIn
            </button>
          </div>
        )}

        {/* API Key Card */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Extension API Key
          </div>
          {apiKey ? (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <code style={{
                  flex: 1, fontFamily: 'monospace', fontSize: 11,
                  background: '#f7f7f5', border: '1px solid #e8e8e8',
                  borderRadius: 7, padding: '8px 10px',
                  color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {apiKey}
                </code>
                <button
                  type="button"
                  onClick={copyKey}
                  style={{
                    padding: '8px 12px',
                    background: copied ? '#f0fdf4' : '#0a0a0a',
                    color: copied ? '#16a34a' : '#fff',
                    border: '1px solid ' + (copied ? '#bbf7d0' : '#0a0a0a'),
                    borderRadius: 7, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <button
                type="button"
                onClick={generateKey}
                disabled={generatingKey}
                style={{ fontSize: 11, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                {generatingKey ? 'Regenerating…' : 'Regenerate key'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={generateKey}
              disabled={generatingKey}
              style={{
                width: '100%', padding: '9px 14px',
                background: '#0a0a0a', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13,
                fontWeight: 600, cursor: generatingKey ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: generatingKey ? 0.6 : 1,
              }}
            >
              {generatingKey ? 'Generating…' : 'Generate API Key'}
            </button>
          )}
        </div>

        {/* How to Start */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            How to Start
          </div>
          {[
            ['1', 'Set your search',      'Fill in job title + location and click "Save Settings".'],
            ['2', 'Get your API key',      'Click "Generate API Key" and copy it.'],
            ['3', 'Open the extension',    'Click the reblet icon in Chrome.'],
            ['4', 'Paste your API key',    'Paste it in the extension popup and click Connect.'],
            ['5', 'Go to LinkedIn Jobs',   'Click "Open on LinkedIn" — jobs are pre-filtered for Easy Apply.'],
            ['6', 'Hit Start Auto Apply',  'The extension handles everything from here.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: '#0a0a0a', color: '#fff',
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{n}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0a0a0a', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11.5, color: '#888', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
