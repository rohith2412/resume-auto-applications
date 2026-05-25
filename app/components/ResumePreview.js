'use client'

const PAGE = { fontFamily: 'inherit', fontSize: '9.5pt', lineHeight: 1.45, color: '#111', background: '#fff', padding: '0.55in 0.6in', width: '8.5in', minHeight: '11in', boxSizing: 'border-box' }

export default function ResumePreview({ resume, template = 'classic' }) {
  if (template === 'modern') return <ModernTemplate resume={resume} />
  if (template === 'minimal') return <MinimalTemplate resume={resume} />
  return <ClassicTemplate resume={resume} />
}

/* ──────────────────────────────────────────────────────────────
   CLASSIC TEMPLATE
   Traditional formal look — serif header, ruled sections
────────────────────────────────────────────────────────────── */
function ClassicTemplate({ resume }) {
  const p = resume?.personalInfo || {}
  const contact = [p.phone, p.location, p.email, p.linkedin && shortenUrl(p.linkedin), p.github && shortenUrl(p.github), p.portfolio && shortenUrl(p.portfolio)].filter(Boolean)

  return (
    <div style={{ ...PAGE, fontFamily: '"Times New Roman", Georgia, serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '10pt', borderBottom: '2px solid #000', paddingBottom: '8pt' }}>
        <div style={{ fontSize: '20pt', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3pt' }}>{p.fullName || 'Your Name'}</div>
        <div style={{ fontSize: '8.5pt', color: '#333', letterSpacing: '0.02em' }}>{contact.join('  ·  ')}</div>
      </div>

      {resume?.summary && (
        <ClassicSection title="PROFESSIONAL SUMMARY">
          <p style={{ margin: 0, lineHeight: 1.6 }}>{resume.summary}</p>
        </ClassicSection>
      )}

      {resume?.experience?.length > 0 && (
        <ClassicSection title="EXPERIENCE">
          {resume.experience.map((exp, i) => (
            <ExperienceEntry key={i} exp={exp} fontFamily='"Times New Roman", Georgia, serif' />
          ))}
        </ClassicSection>
      )}

      {resume?.projects?.length > 0 && (
        <ClassicSection title="PROJECTS">
          {resume.projects.map((proj, i) => (
            <ProjectEntry key={i} proj={proj} />
          ))}
        </ClassicSection>
      )}

      {resume?.education?.length > 0 && (
        <ClassicSection title="EDUCATION">
          {resume.education.map((edu, i) => (
            <EducationEntry key={i} edu={edu} />
          ))}
        </ClassicSection>
      )}

      <SkillsSection resume={resume} renderSection={ClassicSection} />

      {resume?.certifications?.filter(c => c.name).length > 0 && (
        <ClassicSection title="CERTIFICATIONS">
          {resume.certifications.filter(c => c.name).map((cert, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt' }}>
              <div><strong>{cert.name}</strong>{cert.issuer ? ` — ${cert.issuer}` : ''}</div>
              <span style={{ color: '#555', fontSize: '8.5pt' }}>{cert.date}</span>
            </div>
          ))}
        </ClassicSection>
      )}
    </div>
  )
}

function ClassicSection({ title, children }) {
  return (
    <div style={{ marginBottom: '10pt' }}>
      <div style={{ fontWeight: 700, fontSize: '9pt', letterSpacing: '0.1em', borderBottom: '1.5px solid #000', paddingBottom: '1pt', marginBottom: '5pt', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   MODERN TEMPLATE
   Clean with blue accent — good for tech/product roles
────────────────────────────────────────────────────────────── */
function ModernTemplate({ resume }) {
  const p = resume?.personalInfo || {}
  const ACCENT = '#2563eb'

  return (
    <div style={{ ...PAGE, fontFamily: 'Arial, "Helvetica Neue", sans-serif', padding: '0', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '0.35in 0.5in 0.3in' }}>
        <div style={{ fontSize: '18pt', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '5pt' }}>{p.fullName || 'Your Name'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10pt', fontSize: '8pt', color: '#94a3b8' }}>
          {p.phone && <ContactItem icon="📞" text={p.phone} />}
          {p.email && <ContactItem icon="✉" text={p.email} />}
          {p.location && <ContactItem icon="📍" text={p.location} />}
          {p.linkedin && <ContactItem icon="in" text={shortenUrl(p.linkedin)} bold />}
          {p.github && <ContactItem icon="⌥" text={shortenUrl(p.github)} bold />}
          {p.portfolio && <ContactItem icon="🔗" text={shortenUrl(p.portfolio)} bold />}
        </div>
      </div>

      <div style={{ padding: '0.3in 0.5in', flex: 1 }}>
        {resume?.summary && (
          <ModernSection title="SUMMARY" accent={ACCENT}>
            <p style={{ margin: 0, lineHeight: 1.65, color: '#334155' }}>{resume.summary}</p>
          </ModernSection>
        )}

        {resume?.experience?.length > 0 && (
          <ModernSection title="EXPERIENCE" accent={ACCENT}>
            {resume.experience.map((exp, i) => (
              <ExperienceEntry key={i} exp={exp} accent={ACCENT} fontFamily="Arial, sans-serif" />
            ))}
          </ModernSection>
        )}

        {resume?.projects?.length > 0 && (
          <ModernSection title="PROJECTS" accent={ACCENT}>
            {resume.projects.map((proj, i) => (
              <ProjectEntry key={i} proj={proj} accent={ACCENT} />
            ))}
          </ModernSection>
        )}

        {resume?.education?.length > 0 && (
          <ModernSection title="EDUCATION" accent={ACCENT}>
            {resume.education.map((edu, i) => (
              <EducationEntry key={i} edu={edu} accent={ACCENT} />
            ))}
          </ModernSection>
        )}

        <SkillsSection resume={resume} renderSection={({ title, children }) => <ModernSection title={title} accent={ACCENT}>{children}</ModernSection>} />

        {resume?.certifications?.filter(c => c.name).length > 0 && (
          <ModernSection title="CERTIFICATIONS" accent={ACCENT}>
            {resume.certifications.filter(c => c.name).map((cert, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt', fontSize: '9pt' }}>
                <div><strong>{cert.name}</strong>{cert.issuer ? ` · ${cert.issuer}` : ''}</div>
                <span style={{ color: '#64748b' }}>{cert.date}</span>
              </div>
            ))}
          </ModernSection>
        )}
      </div>
    </div>
  )
}

function ModernSection({ title, children, accent }) {
  return (
    <div style={{ marginBottom: '11pt' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7pt', marginBottom: '6pt' }}>
        <div style={{ width: '3pt', height: '11pt', background: accent, borderRadius: '2pt', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '8.5pt', letterSpacing: '0.1em', color: '#0f172a', textTransform: 'uppercase' }}>{title}</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>
      {children}
    </div>
  )
}

function ContactItem({ icon, text, bold }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '3pt', fontWeight: bold ? 500 : 400 }}>
      <span style={{ fontSize: '8pt' }}>{icon}</span>{text}
    </span>
  )
}

/* ──────────────────────────────────────────────────────────────
   MINIMAL TEMPLATE
   Ultra-clean typography, no decoration
────────────────────────────────────────────────────────────── */
function MinimalTemplate({ resume }) {
  const p = resume?.personalInfo || {}
  const contact = [p.email, p.phone, p.location, p.linkedin && shortenUrl(p.linkedin), p.github && shortenUrl(p.github)].filter(Boolean)

  return (
    <div style={{ ...PAGE, fontFamily: '"Helvetica Neue", Arial, sans-serif', padding: '0.5in 0.65in' }}>
      <div style={{ marginBottom: '12pt' }}>
        <div style={{ fontSize: '17pt', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '3pt' }}>{p.fullName || 'Your Name'}</div>
        <div style={{ fontSize: '8.5pt', color: '#6b7280' }}>{contact.join('  ·  ')}</div>
      </div>
      <div style={{ height: '1.5px', background: '#111', marginBottom: '10pt' }} />

      {resume?.summary && (
        <MinimalSection title="Summary">
          <p style={{ margin: 0, lineHeight: 1.7, color: '#374151' }}>{resume.summary}</p>
        </MinimalSection>
      )}

      {resume?.experience?.length > 0 && (
        <MinimalSection title="Experience">
          {resume.experience.map((exp, i) => (
            <ExperienceEntry key={i} exp={exp} fontFamily='"Helvetica Neue", Arial, sans-serif' minimal />
          ))}
        </MinimalSection>
      )}

      {resume?.projects?.length > 0 && (
        <MinimalSection title="Projects">
          {resume.projects.map((proj, i) => (
            <ProjectEntry key={i} proj={proj} minimal />
          ))}
        </MinimalSection>
      )}

      {resume?.education?.length > 0 && (
        <MinimalSection title="Education">
          {resume.education.map((edu, i) => (
            <EducationEntry key={i} edu={edu} minimal />
          ))}
        </MinimalSection>
      )}

      <SkillsSection resume={resume} renderSection={({ title, children }) => <MinimalSection title={title}>{children}</MinimalSection>} />

      {resume?.certifications?.filter(c => c.name).length > 0 && (
        <MinimalSection title="Certifications">
          {resume.certifications.filter(c => c.name).map((cert, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3pt' }}>
              <span><strong>{cert.name}</strong>{cert.issuer ? `, ${cert.issuer}` : ''}</span>
              <span style={{ color: '#9ca3af', fontSize: '8.5pt' }}>{cert.date}</span>
            </div>
          ))}
        </MinimalSection>
      )}
    </div>
  )
}

function MinimalSection({ title, children }) {
  return (
    <div style={{ marginBottom: '10pt' }}>
      <div style={{ fontWeight: 700, fontSize: '9pt', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5pt' }}>{title}</div>
      {children}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   SHARED ENTRY COMPONENTS
────────────────────────────────────────────────────────────── */
function ExperienceEntry({ exp, accent, fontFamily, minimal }) {
  const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')
  return (
    <div style={{ marginBottom: '8pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontWeight: 700 }}>{exp.title}</span>
          {exp.company && <span style={{ color: accent || '#374151' }}>{accent ? ` · ${exp.company}` : ` — ${exp.company}`}</span>}
          {exp.location && !minimal && <span style={{ color: '#9ca3af' }}>, {exp.location}</span>}
        </div>
        <span style={{ fontSize: '8.5pt', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '8pt' }}>{dates}</span>
      </div>
      {exp.location && minimal && <div style={{ fontSize: '8.5pt', color: '#9ca3af' }}>{exp.location}</div>}
      {exp.bullets?.filter(b => b.trim()).length > 0 && (
        <ul style={{ margin: '3pt 0 0 0', paddingLeft: '13pt' }}>
          {exp.bullets.filter(b => b.trim()).map((b, j) => (
            <li key={j} style={{ marginBottom: '2pt', lineHeight: 1.5 }}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EducationEntry({ edu, accent, minimal }) {
  return (
    <div style={{ marginBottom: '6pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontWeight: 700 }}>{edu.degree}</span>
          {edu.institution && <span style={{ color: accent || '#374151' }}>{accent ? ` · ${edu.institution}` : ` — ${edu.institution}`}</span>}
        </div>
        <span style={{ fontSize: '8.5pt', color: '#9ca3af' }}>{edu.graduationYear}</span>
      </div>
      {edu.gpa && <div style={{ fontSize: '8.5pt', color: '#9ca3af' }}>GPA: {edu.gpa}</div>}
      {edu.courses && <div style={{ fontSize: '8.5pt', color: '#9ca3af' }}>Relevant Coursework: {edu.courses}</div>}
    </div>
  )
}

function ProjectEntry({ proj, accent, minimal }) {
  return (
    <div style={{ marginBottom: '7pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontWeight: 700 }}>{proj.name}</span>
          {proj.technologies && <span style={{ color: '#9ca3af', fontSize: '8.5pt' }}> — {proj.technologies}</span>}
        </div>
        {proj.url && <span style={{ fontSize: '8pt', color: accent || '#6b7280' }}>{shortenUrl(proj.url)}</span>}
      </div>
      {proj.bullets?.filter(b => b.trim()).length > 0 && (
        <ul style={{ margin: '3pt 0 0 0', paddingLeft: '13pt' }}>
          {proj.bullets.filter(b => b.trim()).map((b, j) => (
            <li key={j} style={{ marginBottom: '2pt', lineHeight: 1.5 }}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SkillsSection({ resume, renderSection: RenderSection }) {
  const s = resume?.skills || {}
  const rows = [
    s.technical && { label: 'Technical', value: s.technical },
    s.tools && { label: 'Tools & Software', value: s.tools },
    s.languages && { label: 'Languages / Frameworks', value: s.languages },
    s.soft && { label: 'Soft Skills', value: s.soft },
  ].filter(Boolean)

  if (!rows.length) return null

  return (
    <RenderSection title="SKILLS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3pt' }}>
        {rows.map((r, i) => (
          <div key={i}><strong>{r.label}:</strong> {r.value}</div>
        ))}
      </div>
    </RenderSection>
  )
}

function shortenUrl(url = '') {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

/* ──────────────────────────────────────────────────────────────
   PDF DOWNLOAD
────────────────────────────────────────────────────────────── */
export function downloadResumePDF(resume, template = 'classic') {
  const html = generatePrintHTML(resume, template)
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

function generatePrintHTML(resume, template) {
  const p = resume?.personalInfo || {}
  const su = (url = '') => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  const contact = [p.phone, p.location, p.email, p.linkedin && su(p.linkedin), p.github && su(p.github), p.portfolio && su(p.portfolio)].filter(Boolean)
  const s = resume?.skills || {}
  const skillRows = [
    s.technical && `<strong>Technical:</strong> ${s.technical}`,
    s.tools && `<strong>Tools &amp; Software:</strong> ${s.tools}`,
    s.languages && `<strong>Languages / Frameworks:</strong> ${s.languages}`,
    s.soft && `<strong>Soft Skills:</strong> ${s.soft}`,
  ].filter(Boolean)

  const isModern = template === 'modern'
  const isMinimal = template === 'minimal'

  const fonts = isMinimal || isModern
    ? `font-family: "Helvetica Neue", Arial, sans-serif;`
    : `font-family: "Times New Roman", Georgia, serif;`

  const headerHtml = isModern
    ? `<div style="background:#1e293b;color:#fff;padding:24pt 36pt 20pt;">
        <div style="font-size:18pt;font-weight:700;margin-bottom:4pt;">${p.fullName || 'Your Name'}</div>
        <div style="font-size:8pt;color:#94a3b8;">${contact.join('  ·  ')}</div>
       </div><div style="padding:18pt 36pt;">`
    : `<div style="text-align:center;border-bottom:${isMinimal ? '1.5px solid #111' : '2px solid #000'};padding-bottom:8pt;margin-bottom:10pt;">
        <div style="font-size:${isMinimal ? '17pt' : '20pt'};font-weight:700;">${p.fullName || 'Your Name'}</div>
        <div style="font-size:8.5pt;color:#555;margin-top:3pt;">${contact.join('  ·  ')}</div>
       </div>`

  const closeDiv = isModern ? '</div>' : ''

  function section(title, content) {
    if (!content) return ''
    if (isModern) {
      const header = `<div style="display:flex;align-items:center;gap:7pt;margin-bottom:6pt;">
        <div style="width:3pt;height:11pt;background:#2563eb;border-radius:2pt;flex-shrink:0;"></div>
        <span style="font-weight:700;font-size:8.5pt;letter-spacing:0.1em;text-transform:uppercase;color:#0f172a;">${title}</span>
        <div style="flex:1;height:1px;background:#e2e8f0;"></div>
      </div>`
      return `<div style="margin-bottom:11pt;">${header}${content}</div>`
    }
    if (isMinimal) {
      return `<div style="margin-bottom:10pt;"><div style="font-weight:700;font-size:9pt;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin-bottom:5pt;">${title}</div>${content}</div>`
    }
    return `<div style="margin-bottom:10pt;"><div style="font-weight:700;font-size:9pt;letter-spacing:0.1em;text-transform:uppercase;border-bottom:1.5px solid #000;padding-bottom:1pt;margin-bottom:5pt;">${title}</div>${content}</div>`
  }

  const expHtml = (resume?.experience || []).map(exp => {
    const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')
    const bullets = (exp.bullets || []).filter(b => b.trim()).map(b => `<li style="margin-bottom:2pt;line-height:1.5;">${b}</li>`).join('')
    return `<div style="margin-bottom:8pt;">
      <div style="display:flex;justify-content:space-between;">
        <div><strong>${exp.title}</strong>${exp.company ? ` — ${exp.company}` : ''}${exp.location ? `, <em>${exp.location}</em>` : ''}</div>
        <span style="color:#888;font-size:8.5pt;">${dates}</span>
      </div>
      ${bullets ? `<ul style="margin:3pt 0 0 0;padding-left:13pt;">${bullets}</ul>` : ''}
    </div>`
  }).join('')

  const eduHtml = (resume?.education || []).map(edu => {
    return `<div style="margin-bottom:6pt;">
      <div style="display:flex;justify-content:space-between;">
        <div><strong>${edu.degree}</strong>${edu.institution ? ` — ${edu.institution}` : ''}</div>
        <span style="color:#888;font-size:8.5pt;">${edu.graduationYear || ''}</span>
      </div>
      ${edu.gpa ? `<div style="font-size:8.5pt;color:#888;">GPA: ${edu.gpa}</div>` : ''}
      ${edu.courses ? `<div style="font-size:8.5pt;color:#888;">Coursework: ${edu.courses}</div>` : ''}
    </div>`
  }).join('')

  const projHtml = (resume?.projects || []).map(proj => {
    const bullets = (proj.bullets || []).filter(b => b.trim()).map(b => `<li style="margin-bottom:2pt;line-height:1.5;">${b}</li>`).join('')
    return `<div style="margin-bottom:7pt;">
      <div style="display:flex;justify-content:space-between;">
        <div><strong>${proj.name}</strong>${proj.technologies ? ` — <span style="color:#888;">${proj.technologies}</span>` : ''}</div>
        ${proj.url ? `<span style="font-size:8pt;color:#888;">${proj.url}</span>` : ''}
      </div>
      ${bullets ? `<ul style="margin:3pt 0 0 0;padding-left:13pt;">${bullets}</ul>` : ''}
    </div>`
  }).join('')

  const certHtml = (resume?.certifications || []).filter(c => c.name).map(cert => {
    return `<div style="display:flex;justify-content:space-between;margin-bottom:4pt;">
      <div><strong>${cert.name}</strong>${cert.issuer ? ` — ${cert.issuer}` : ''}</div>
      <span style="color:#888;font-size:8.5pt;">${cert.date || ''}</span>
    </div>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { ${fonts} font-size: 9.5pt; line-height: 1.45; color: #111; background: #fff; ${isModern ? '' : 'padding: 0.5in 0.6in;'} }
    @page { margin: 0; size: letter; }
    @media print { body { margin: 0; } }
    ul { list-style: disc; }
  </style>
  </head><body>
  ${headerHtml}
  ${resume?.summary ? section('PROFESSIONAL SUMMARY', `<p style="line-height:1.65;">${resume.summary}</p>`) : ''}
  ${expHtml ? section('EXPERIENCE', expHtml) : ''}
  ${projHtml ? section('PROJECTS', projHtml) : ''}
  ${eduHtml ? section('EDUCATION', eduHtml) : ''}
  ${skillRows.length ? section('SKILLS', `<div style="display:flex;flex-direction:column;gap:3pt;">${skillRows.map(r => `<div>${r}</div>`).join('')}</div>`) : ''}
  ${certHtml ? section('CERTIFICATIONS', certHtml) : ''}
  ${closeDiv}
  </body></html>`
}
