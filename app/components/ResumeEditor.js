'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ResumePreview, { downloadResumePDF } from './ResumePreview'

const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Traditional & formal' },
  { id: 'modern', label: 'Modern', desc: 'Clean with accent' },
  { id: 'minimal', label: 'Minimal', desc: 'Ultra-clean' },
]

const SECTIONS = [
  { id: 'personal',        label: 'Personal Info',   icon: '👤' },
  { id: 'summary',         label: 'Summary',         icon: '✍' },
  { id: 'experience',      label: 'Experience',      icon: '💼' },
  { id: 'education',       label: 'Education',       icon: '🎓' },
  { id: 'skills',          label: 'Skills',          icon: '⚡' },
  { id: 'projects',        label: 'Projects',        icon: '🚀' },
  { id: 'certifications',  label: 'Certifications',  icon: '🏆' },
]

export default function ResumeEditor({ resumeId, user, onBack, toast }) {
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [activeTab, setActiveTab] = useState('build')
  const [activeSection, setActiveSection] = useState('personal')
  const saveTimer = useRef(null)
  const latestResume = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}`)
      const data = await res.json()
      if (res.ok) {
        setResume(data.resume)
        latestResume.current = data.resume
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [resumeId])

  useEffect(() => { load() }, [load])

  function updateResume(updates) {
    setResume(prev => {
      const next = deepMerge(prev, updates)
      latestResume.current = next
      return next
    })
    setSaveStatus('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 1800)
  }

  async function doSave() {
    if (!latestResume.current) return
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(latestResume.current),
      })
      if (res.ok) setSaveStatus('saved')
      else setSaveStatus('error')
    } catch { setSaveStatus('error') }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-dots" style={{ color: 'var(--gray-300)' }}><span /><span /><span /></div>
      </div>
    )
  }

  if (!resume) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--gray-500)' }}>Resume not found.</p>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back to dashboard</button>
      </div>
    )
  }

  const TABS = [
    { id: 'build',        label: 'Build' },
    { id: 'preview',      label: 'Preview' },
    { id: 'cover-letter', label: 'Cover Letter' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem', height: '52px', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ color: '#6b7280', padding: '0.375rem 0.625rem' }}>
          <span style={{ fontSize: '0.75rem' }}>←</span> Dashboard
        </button>
        <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />
        <input
          value={resume.name || ''}
          onChange={e => updateResume({ name: e.target.value })}
          style={{ border: 'none', outline: 'none', fontWeight: 600, fontSize: '0.9375rem', background: 'transparent', fontFamily: 'inherit', flex: 1, minWidth: 0 }}
          placeholder="Resume name"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <SaveBadge status={saveStatus} />
          {resume.score !== null && resume.score !== undefined && (
            <ScorePill score={resume.score} onClick={() => setActiveTab('preview')} />
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => downloadResumePDF(resume, resume.template)}>
            <DownloadIcon /> PDF
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', padding: '0 1.25rem', flexShrink: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#000' : 'transparent'}`, color: activeTab === tab.id ? '#000' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', marginBottom: '-1px' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'build' && (
          <BuildTab resume={resume} activeSection={activeSection} onSectionChange={setActiveSection} onChange={updateResume} toast={toast} resumeId={resumeId} />
        )}
        {activeTab === 'preview' && (
          <PreviewTab resume={resume} onChange={updateResume} toast={toast} resumeId={resumeId} />
        )}
        {activeTab === 'cover-letter' && (
          <CoverLetterTab resume={resume} resumeId={resumeId} toast={toast} onChange={updateResume} />
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   BUILD TAB — 2-panel editor + preview
────────────────────────────────────────────────────────────── */
function BuildTab({ resume, activeSection, onSectionChange, onChange, toast, resumeId }) {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left — section nav + editor */}
      <div style={{ width: '44%', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Section nav */}
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0.75rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => onSectionChange(sec.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${activeSection === sec.id ? '#000' : '#e5e7eb'}`, background: activeSection === sec.id ? '#000' : '#fff', color: activeSection === sec.id ? '#fff' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}>
              {sec.label}
            </button>
          ))}
        </div>

        {/* Section editor */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
          {activeSection === 'personal' && <PersonalSection resume={resume} onChange={onChange} />}
          {activeSection === 'summary' && <SummarySection resume={resume} onChange={onChange} resumeId={resumeId} toast={toast} />}
          {activeSection === 'experience' && <ExperienceSection resume={resume} onChange={onChange} resumeId={resumeId} toast={toast} />}
          {activeSection === 'education' && <EducationSection resume={resume} onChange={onChange} />}
          {activeSection === 'skills' && <SkillsSection resume={resume} onChange={onChange} />}
          {activeSection === 'projects' && <ProjectsSection resume={resume} onChange={onChange} resumeId={resumeId} toast={toast} />}
          {activeSection === 'certifications' && <CertificationsSection resume={resume} onChange={onChange} />}
        </div>
      </div>

      {/* Right — live preview */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
        <TemplatePicker value={resume.template} onChange={t => onChange({ template: t })} />
        <PreviewScaler resume={resume} />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   PREVIEW TAB — full preview + score
────────────────────────────────────────────────────────────── */
function PreviewTab({ resume, onChange, toast, resumeId }) {
  const [scoring, setScoring] = useState(false)
  const [scoreData, setScoreData] = useState(
    resume.score !== null && resume.score !== undefined
      ? { overall: resume.score, ...resume.scoreBreakdown, feedback: resume.scoreFeedback || [] }
      : null
  )

  async function handleScore() {
    setScoring(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/score`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setScoreData(data)
        onChange({ score: data.overall, scoreBreakdown: { ats: data.ats, impact: data.impact, completeness: data.completeness, keywords: data.keywords }, scoreFeedback: data.feedback })
        toast('Resume scored!')
      } else { toast(data.error || 'Failed to score', 'error') }
    } catch { toast('Something went wrong', 'error') }
    setScoring(false)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Preview */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
        <TemplatePicker value={resume.template} onChange={t => onChange({ template: t })} />
        <div style={{ marginTop: '1rem' }}>
          <PreviewScaler resume={resume} scale={0.72} />
        </div>
      </div>

      {/* Score sidebar */}
      <div style={{ width: '280px', borderLeft: '1px solid #e5e7eb', overflow: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Resume Score</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5 }}>AI analysis of your resume's strength and ATS readiness.</p>
        </div>

        {scoreData ? (
          <>
            <ScoreCircle score={scoreData.overall} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'ATS Compatibility', val: scoreData.ats },
                { label: 'Impact & Achievements', val: scoreData.impact },
                { label: 'Completeness', val: scoreData.completeness },
                { label: 'Keywords', val: scoreData.keywords },
              ].map((item, i) => (
                <ScoreBar key={i} label={item.label} value={item.val} />
              ))}
            </div>
            {scoreData.feedback?.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Improvements</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {scoreData.feedback.map((tip, i) => (
                    <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.5rem 0.625rem', fontSize: '0.8125rem', lineHeight: 1.5, color: '#78350f' }}>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={handleScore} disabled={scoring}>
              {scoring ? <><span className="spinner spinner-dark" style={{ width: '14px', height: '14px' }} /> Scoring...</> : 'Rescore'}
            </button>
          </>
        ) : (
          <button className="btn btn-black" onClick={handleScore} disabled={scoring} style={{ height: '42px' }}>
            {scoring ? <><span className="spinner" style={{ width: '15px', height: '15px' }} /> Analyzing...</> : '✦ Score my resume'}
          </button>
        )}

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.75rem' }}>Download</p>
          <button className="btn btn-black" onClick={() => downloadResumePDF(resume, resume.template)} style={{ width: '100%', justifyContent: 'center' }}>
            <DownloadIcon /> Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   TAILOR TAB
────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   COVER LETTER TAB
────────────────────────────────────────────────────────────── */
function CoverLetterTab({ resume, resumeId, toast, onChange }) {
  const [jobDesc, setJobDesc] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [hiringManager, setHiringManager] = useState('')
  const [letter, setLetter] = useState(resume.coverLetter || '')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!jobDesc.trim()) { toast('Please paste a job description', 'error'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobDesc, companyName, hiringManager }),
      })
      const data = await res.json()
      if (res.ok) {
        setLetter(data.coverLetter)
        onChange({ coverLetter: data.coverLetter })
        toast('Cover letter generated!')
      } else { toast(data.error || 'Failed', 'error') }
    } catch { toast('Something went wrong', 'error') }
    setLoading(false)
  }

  function copyLetter() {
    navigator.clipboard.writeText(letter)
    toast('Copied to clipboard!')
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '2rem', display: 'flex', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }} className="animate-fade">
      {/* Left: inputs */}
      <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>Cover letter</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>AI writes a personalized letter using your resume and the job description.</p>
        </div>

        <InputRow label="Job description *">
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={9} placeholder="Paste the full job description..." className="input" style={{ resize: 'vertical', lineHeight: 1.7, fontFamily: 'inherit' }} />
        </InputRow>
        <InputRow label="Company name (optional)">
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Google, Acme Inc..." className="input" />
        </InputRow>
        <InputRow label="Hiring manager name (optional)">
          <input value={hiringManager} onChange={e => setHiringManager(e.target.value)} placeholder="Jane Smith, Hiring Manager..." className="input" />
        </InputRow>

        <button className="btn btn-black" onClick={handleGenerate} disabled={loading || !jobDesc.trim()} style={{ height: '42px' }}>
          {loading ? <><span className="spinner" style={{ width: '15px', height: '15px' }} /> Generating...</> : '✦ Generate cover letter'}
        </button>
      </div>

      {/* Right: output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
        {letter ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600 }}>✓ Generated</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={copyLetter}><CopyIcon /> Copy</button>
                <button className="btn btn-secondary btn-sm" onClick={handleGenerate} disabled={loading}>Regenerate</button>
              </div>
            </div>
            <textarea
              value={letter}
              onChange={e => { setLetter(e.target.value); onChange({ coverLetter: e.target.value }) }}
              style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem', fontFamily: 'inherit', fontSize: '0.9375rem', lineHeight: 1.8, resize: 'none', outline: 'none', color: '#111', background: '#fff', minHeight: '400px' }}
            />
          </>
        ) : (
          <div style={{ flex: 1, border: '1px dashed #e5e7eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem' }}>✉</div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#374151' }}>Your cover letter appears here</p>
            <p style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>Fill in the job description on the left and click Generate.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   SECTION EDITORS
────────────────────────────────────────────────────────────── */
function PersonalSection({ resume, onChange }) {
  const p = resume.personalInfo || {}
  function upd(key, val) { onChange({ personalInfo: { ...p, [key]: val } }) }
  return (
    <SectionWrapper title="Personal Information" desc="Appears in your resume header">
      <Grid2>
        <Field label="Full name"><input value={p.fullName || ''} onChange={e => upd('fullName', e.target.value)} placeholder="Jane Doe" className="input" /></Field>
        <Field label="Email"><input value={p.email || ''} onChange={e => upd('email', e.target.value)} placeholder="jane@email.com" className="input" type="email" /></Field>
      </Grid2>
      <Grid2>
        <Field label="Phone"><input value={p.phone || ''} onChange={e => upd('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="input" /></Field>
        <Field label="Location"><input value={p.location || ''} onChange={e => upd('location', e.target.value)} placeholder="San Francisco, CA" className="input" /></Field>
      </Grid2>
      <Field label="LinkedIn URL"><input value={p.linkedin || ''} onChange={e => upd('linkedin', e.target.value)} placeholder="linkedin.com/in/janedoe" className="input" /></Field>
      <Grid2>
        <Field label="GitHub"><input value={p.github || ''} onChange={e => upd('github', e.target.value)} placeholder="github.com/janedoe" className="input" /></Field>
        <Field label="Portfolio / Website"><input value={p.portfolio || ''} onChange={e => upd('portfolio', e.target.value)} placeholder="janedoe.dev" className="input" /></Field>
      </Grid2>
    </SectionWrapper>
  )
}

function SummarySection({ resume, onChange, resumeId, toast }) {
  const [improving, setImproving] = useState(false)

  async function handleImprove() {
    if (!resume.summary?.trim()) { toast('Write a summary first, then improve it', 'error'); return }
    setImproving(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resume.summary, type: 'summary' }),
      })
      const data = await res.json()
      if (res.ok) { onChange({ summary: data.improved }); toast('Summary improved!') }
      else toast(data.error || 'Failed', 'error')
    } catch { toast('Something went wrong', 'error') }
    setImproving(false)
  }

  return (
    <SectionWrapper title="Professional Summary" desc="2-3 sentences about who you are and what you offer">
      <div style={{ position: 'relative' }}>
        <textarea
          value={resume.summary || ''}
          onChange={e => onChange({ summary: e.target.value })}
          rows={5}
          placeholder="Results-driven software engineer with 3+ years of experience building scalable web applications. Passionate about clean code and great user experiences..."
          className="input"
          style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
        />
      </div>
      <button className="btn btn-secondary btn-sm" onClick={handleImprove} disabled={improving} style={{ alignSelf: 'flex-start' }}>
        {improving ? <><span className="spinner spinner-dark" style={{ width: '13px', height: '13px' }} /> Improving...</> : '✦ Improve with AI'}
      </button>
    </SectionWrapper>
  )
}

function ExperienceSection({ resume, onChange, resumeId, toast }) {
  const exp = resume.experience || []

  function addExp() {
    onChange({ experience: [...exp, { company: '', title: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] })
  }

  function updateExp(i, updates) {
    const next = exp.map((e, idx) => idx === i ? { ...e, ...updates } : e)
    onChange({ experience: next })
  }

  function removeExp(i) {
    onChange({ experience: exp.filter((_, idx) => idx !== i) })
  }

  return (
    <SectionWrapper title="Work Experience" desc="Add your most recent positions first">
      {exp.map((e, i) => (
        <ExperienceCard key={i} exp={e} index={i} onUpdate={u => updateExp(i, u)} onRemove={() => removeExp(i)} resumeId={resumeId} toast={toast} />
      ))}
      <button className="btn btn-secondary btn-sm" onClick={addExp} style={{ alignSelf: 'flex-start' }}>
        + Add position
      </button>
    </SectionWrapper>
  )
}

function ExperienceCard({ exp, index, onUpdate, onRemove, resumeId, toast }) {
  const [open, setOpen] = useState(index === 0)
  const [improvingIdx, setImprovingIdx] = useState(null)
  const [generating, setGenerating] = useState(false)

  function updateBullet(bi, val) {
    const bullets = [...(exp.bullets || [])]
    bullets[bi] = val
    onUpdate({ bullets })
  }
  function addBullet() { onUpdate({ bullets: [...(exp.bullets || []), ''] }) }
  function removeBullet(bi) { onUpdate({ bullets: (exp.bullets || []).filter((_, i) => i !== bi) }) }

  async function improveBullet(bi) {
    if (!exp.bullets[bi]?.trim()) return
    setImprovingIdx(bi)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: exp.bullets[bi], type: 'bullet', context: { title: exp.title, company: exp.company } }),
      })
      const data = await res.json()
      if (res.ok) { updateBullet(bi, data.improved); toast('Bullet improved!') }
      else toast(data.error || 'Failed', 'error')
    } catch { toast('Something went wrong', 'error') }
    setImprovingIdx(null)
  }

  async function generateBullets() {
    if (!exp.title) { toast('Add a job title first', 'error'); return }
    setGenerating(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${exp.title} at ${exp.company}`, type: 'generate_bullets', context: { title: exp.title, company: exp.company } }),
      })
      const data = await res.json()
      if (res.ok) {
        const newBullets = data.improved.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*]\s*/, ''))
        onUpdate({ bullets: newBullets })
        toast('Bullets generated!')
      } else toast(data.error || 'Failed', 'error')
    } catch { toast('Something went wrong', 'error') }
    setGenerating(false)
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', background: open ? '#f9fafb' : '#fff', userSelect: 'none' }} onClick={() => setOpen(v => !v)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.title || 'New Position'}{exp.company ? ` — ${exp.company}` : ''}</p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{[exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ') || 'No dates set'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onRemove() }} style={{ color: '#dc2626', padding: '0.25rem 0.375rem' }}><TrashIcon /></button>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem', padding: '0.25rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Grid2>
            <Field label="Job title">
              <input value={exp.title || ''} onChange={e => onUpdate({ title: e.target.value })} placeholder="Software Engineer" className="input" />
            </Field>
            <Field label="Company">
              <input value={exp.company || ''} onChange={e => onUpdate({ company: e.target.value })} placeholder="Google" className="input" />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="Location">
              <input value={exp.location || ''} onChange={e => onUpdate({ location: e.target.value })} placeholder="San Francisco, CA" className="input" />
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Date range</label>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <input value={exp.startDate || ''} onChange={e => onUpdate({ startDate: e.target.value })} placeholder="Jan 2022" className="input" style={{ flex: 1 }} />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>–</span>
                <input value={exp.endDate || ''} onChange={e => onUpdate({ endDate: e.target.value })} placeholder="Dec 2023" disabled={exp.current} className="input" style={{ flex: 1 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!exp.current} onChange={e => onUpdate({ current: e.target.checked, endDate: '' })} style={{ accentColor: '#000' }} />
                Currently working here
              </label>
            </div>
          </Grid2>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Bullet points</label>
              <button className="btn btn-secondary btn-sm" onClick={generateBullets} disabled={generating} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
                {generating ? <><span className="spinner spinner-dark" style={{ width: '12px', height: '12px' }} /> Generating...</> : '✦ AI generate'}
              </button>
            </div>
            {(exp.bullets || []).map((bullet, bi) => (
              <div key={bi} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#9ca3af', paddingTop: '0.6rem', fontSize: '0.75rem', flexShrink: 0 }}>•</span>
                <textarea
                  value={bullet}
                  onChange={e => updateBullet(bi, e.target.value)}
                  placeholder="Led development of feature X, resulting in..."
                  rows={2}
                  className="input"
                  style={{ flex: 1, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => improveBullet(bi)} disabled={improvingIdx === bi} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                    {improvingIdx === bi ? <span className="spinner spinner-dark" style={{ width: '12px', height: '12px' }} /> : '✦'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeBullet(bi)} style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}><TrashIcon /></button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addBullet} style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>+ Add bullet</button>
          </div>
        </div>
      )}
    </div>
  )
}

function EducationSection({ resume, onChange }) {
  const edu = resume.education || []

  function addEdu() {
    onChange({ education: [...edu, { institution: '', degree: '', gpa: '', graduationYear: '', courses: '' }] })
  }
  function updateEdu(i, updates) {
    onChange({ education: edu.map((e, idx) => idx === i ? { ...e, ...updates } : e) })
  }
  function removeEdu(i) { onChange({ education: edu.filter((_, idx) => idx !== i) }) }

  return (
    <SectionWrapper title="Education" desc="Degrees, certifications, bootcamps, trade schools">
      {edu.map((e, i) => (
        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.institution || 'New Education Entry'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => removeEdu(i)} style={{ color: '#dc2626', padding: '0.25rem 0.375rem' }}><TrashIcon /></button>
          </div>
          <Grid2>
            <Field label="Institution / School">
              <input value={e.institution || ''} onChange={ev => updateEdu(i, { institution: ev.target.value })} placeholder="MIT, Stanford, Bootcamp..." className="input" />
            </Field>
            <Field label="Degree / Certification">
              <input value={e.degree || ''} onChange={ev => updateEdu(i, { degree: ev.target.value })} placeholder="B.S. Computer Science, AWS Certified..." className="input" />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="GPA (optional)">
              <input value={e.gpa || ''} onChange={ev => updateEdu(i, { gpa: ev.target.value })} placeholder="3.8 / 4.0" className="input" />
            </Field>
            <Field label="Graduation / Completion">
              <input value={e.graduationYear || ''} onChange={ev => updateEdu(i, { graduationYear: ev.target.value })} placeholder="May 2025, In progress..." className="input" />
            </Field>
          </Grid2>
          <Field label="Relevant coursework (comma-separated)">
            <input value={e.courses || ''} onChange={ev => updateEdu(i, { courses: ev.target.value })} placeholder="Data Structures, Machine Learning, Algorithms..." className="input" />
          </Field>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" onClick={addEdu} style={{ alignSelf: 'flex-start' }}>+ Add education</button>
    </SectionWrapper>
  )
}

function SkillsSection({ resume, onChange }) {
  const s = resume.skills || {}
  function upd(key, val) { onChange({ skills: { ...s, [key]: val } }) }
  return (
    <SectionWrapper title="Skills" desc="Comma-separated — AI uses these for keyword optimization">
      <Field label="Specialized skills / Domain knowledge">
        <input value={s.technical || ''} onChange={e => upd('technical', e.target.value)} placeholder="Financial modeling, Machine learning, Patient care, UX research..." className="input" />
      </Field>
      <Field label="Tools & Software">
        <input value={s.tools || ''} onChange={e => upd('tools', e.target.value)} placeholder="Figma, Salesforce, Excel, React, PostgreSQL, Adobe CC..." className="input" />
      </Field>
      <Field label="Languages / Frameworks">
        <input value={s.languages || ''} onChange={e => upd('languages', e.target.value)} placeholder="Python, JavaScript, TypeScript, SQL, Java..." className="input" />
      </Field>
      <Field label="Soft skills">
        <input value={s.soft || ''} onChange={e => upd('soft', e.target.value)} placeholder="Leadership, Communication, Cross-functional collaboration..." className="input" />
      </Field>
    </SectionWrapper>
  )
}

function ProjectsSection({ resume, onChange, resumeId, toast }) {
  const projects = resume.projects || []

  function addProject() {
    onChange({ projects: [...projects, { name: '', technologies: '', url: '', bullets: [''] }] })
  }
  function updateProject(i, updates) {
    onChange({ projects: projects.map((p, idx) => idx === i ? { ...p, ...updates } : p) })
  }
  function removeProject(i) { onChange({ projects: projects.filter((_, idx) => idx !== i) }) }

  return (
    <SectionWrapper title="Projects" desc="Personal projects, open source, side projects">
      {projects.map((proj, i) => (
        <ProjectCard key={i} proj={proj} index={i} onUpdate={u => updateProject(i, u)} onRemove={() => removeProject(i)} resumeId={resumeId} toast={toast} />
      ))}
      <button className="btn btn-secondary btn-sm" onClick={addProject} style={{ alignSelf: 'flex-start' }}>+ Add project</button>
    </SectionWrapper>
  )
}

function ProjectCard({ proj, index, onUpdate, onRemove, resumeId, toast }) {
  const [open, setOpen] = useState(index === 0)
  const [improvingIdx, setImprovingIdx] = useState(null)

  function updateBullet(bi, val) {
    const bullets = [...(proj.bullets || [])]
    bullets[bi] = val
    onUpdate({ bullets })
  }
  function addBullet() { onUpdate({ bullets: [...(proj.bullets || []), ''] }) }
  function removeBullet(bi) { onUpdate({ bullets: (proj.bullets || []).filter((_, i) => i !== bi) }) }

  async function improveBullet(bi) {
    if (!proj.bullets[bi]?.trim()) return
    setImprovingIdx(bi)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: proj.bullets[bi], type: 'bullet', context: { title: proj.name, company: 'personal project' } }),
      })
      const data = await res.json()
      if (res.ok) { updateBullet(bi, data.improved); toast('Bullet improved!') }
      else toast(data.error || 'Failed', 'error')
    } catch { toast('Something went wrong', 'error') }
    setImprovingIdx(null)
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', background: open ? '#f9fafb' : '#fff' }} onClick={() => setOpen(v => !v)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name || 'New Project'}</p>
          {proj.technologies && <p style={{ fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.technologies}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onRemove() }} style={{ color: '#dc2626', padding: '0.25rem 0.375rem' }}><TrashIcon /></button>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem', padding: '0.25rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Grid2>
            <Field label="Project name">
              <input value={proj.name || ''} onChange={e => onUpdate({ name: e.target.value })} placeholder="Resume Builder App" className="input" />
            </Field>
            <Field label="Project URL (optional)">
              <input value={proj.url || ''} onChange={e => onUpdate({ url: e.target.value })} placeholder="github.com/you/project" className="input" />
            </Field>
          </Grid2>
          <Field label="Technologies">
            <input value={proj.technologies || ''} onChange={e => onUpdate({ technologies: e.target.value })} placeholder="React, Node.js, PostgreSQL, AWS" className="input" />
          </Field>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '0.5rem' }}>Bullet points</label>
            {(proj.bullets || []).map((bullet, bi) => (
              <div key={bi} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#9ca3af', paddingTop: '0.6rem', fontSize: '0.75rem', flexShrink: 0 }}>•</span>
                <textarea value={bullet} onChange={e => updateBullet(bi, e.target.value)} rows={2} className="input" placeholder="Built feature X using Y, resulting in..." style={{ flex: 1, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => improveBullet(bi)} disabled={improvingIdx === bi} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                    {improvingIdx === bi ? <span className="spinner spinner-dark" style={{ width: '12px', height: '12px' }} /> : '✦'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeBullet(bi)} style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}><TrashIcon /></button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addBullet} style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>+ Add bullet</button>
          </div>
        </div>
      )}
    </div>
  )
}

function CertificationsSection({ resume, onChange }) {
  const certs = resume.certifications || []
  function addCert() { onChange({ certifications: [...certs, { name: '', issuer: '', date: '' }] }) }
  function updateCert(i, updates) { onChange({ certifications: certs.map((c, idx) => idx === i ? { ...c, ...updates } : c) }) }
  function removeCert(i) { onChange({ certifications: certs.filter((_, idx) => idx !== i) }) }

  return (
    <SectionWrapper title="Certifications" desc="Professional certifications and credentials">
      {certs.map((cert, i) => (
        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cert.name || 'New Certification'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => removeCert(i)} style={{ color: '#dc2626', padding: '0.25rem 0.375rem' }}><TrashIcon /></button>
          </div>
          <Grid2>
            <Field label="Certification name">
              <input value={cert.name || ''} onChange={e => updateCert(i, { name: e.target.value })} placeholder="AWS Solutions Architect" className="input" />
            </Field>
            <Field label="Issuing organization">
              <input value={cert.issuer || ''} onChange={e => updateCert(i, { issuer: e.target.value })} placeholder="Amazon Web Services" className="input" />
            </Field>
          </Grid2>
          <Field label="Date">
            <input value={cert.date || ''} onChange={e => updateCert(i, { date: e.target.value })} placeholder="March 2024" className="input" />
          </Field>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" onClick={addCert} style={{ alignSelf: 'flex-start' }}>+ Add certification</button>
    </SectionWrapper>
  )
}

/* ──────────────────────────────────────────────────────────────
   SHARED UI COMPONENTS
────────────────────────────────────────────────────────────── */
function SectionWrapper({ title, desc, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ marginBottom: '0.25rem' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>{title}</p>
        {desc && <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>{label}</label>
      {children}
    </div>
  )
}

function InputRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4b5563' }}>{label}</label>
      {children}
    </div>
  )
}

function TemplatePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
      {TEMPLATES.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ padding: '0.375rem 0.875rem', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, border: `1.5px solid ${value === t.id ? '#000' : '#e5e7eb'}`, background: value === t.id ? '#000' : '#fff', color: value === t.id ? '#fff' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s', whiteSpace: 'nowrap' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function PreviewScaler({ resume, scale = 0.62 }) {
  const W = 816  // 8.5in at 96dpi
  const H = 1100 // approximate letter page height
  return (
    <div style={{ position: 'relative', width: `${W * scale}px`, height: `${H * scale}px`, overflow: 'hidden', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderRadius: '4px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: `${W}px`, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        <ResumePreview resume={resume} template={resume?.template || 'classic'} />
      </div>
    </div>
  )
}

function SaveBadge({ status }) {
  if (status === 'saving') return <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Saving...</span>
  if (status === 'saved') return <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ color: '#16a34a' }}>●</span> Saved</span>
  if (status === 'unsaved') return <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Unsaved</span>
  if (status === 'error') return <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Save failed</span>
  return null
}

function ScorePill({ score, onClick }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: `1.5px solid ${color}`, borderRadius: '999px', padding: '0.2rem 0.625rem', fontSize: '0.8125rem', fontWeight: 700, color, cursor: 'pointer', fontFamily: 'inherit' }}>
      {score}/100
    </button>
  )
}

function ScoreCircle({ score }) {
  const size = 96, stroke = 8, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ marginTop: '-72px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>/ 100</span>
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: color === '#16a34a' ? '#15803d' : color === '#d97706' ? '#b45309' : '#b91c1c' }}>
        {score >= 80 ? 'Strong resume' : score >= 60 ? 'Good — could be better' : 'Needs improvement'}
      </p>
    </div>
  )
}

function ScoreBar({ label, value }) {
  const color = value >= 80 ? '#16a34a' : value >= 60 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   UTILS
────────────────────────────────────────────────────────────── */
function deepMerge(base, updates) {
  const result = { ...base }
  for (const key in updates) {
    if (updates[key] !== null && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
      result[key] = deepMerge(base[key] || {}, updates[key])
    } else {
      result[key] = updates[key]
    }
  }
  return result
}

/* ──────────────────────────────────────────────────────────────
   ICONS
────────────────────────────────────────────────────────────── */
function DownloadIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 11h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 8.5v-7h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10M4.5 3.5V2h4v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 3.5l-.75 7.5h-5.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
