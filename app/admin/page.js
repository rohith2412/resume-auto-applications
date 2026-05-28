'use client'
import { useState, useEffect } from 'react'

// ── helpers ──────────────────────────────────────────────────────
function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function initials(email = '') {
  return email.slice(0, 2).toUpperCase()
}
function hashColor(str = '') {
  const palette = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return palette[h % palette.length]
}

// ── sub-components ──────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '18px 22px', flex: '1 1 140px', minWidth: 130 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Badge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: active ? '#f0fdf4' : '#fafafa',
      color: active ? '#16a34a' : '#aaa',
      border: `1px solid ${active ? '#bbf7d0' : '#e8e8e8'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function AppBreakdown({ apps }) {
  const items = [
    { label: 'Applied',   val: apps.applied,   color: '#3b82f6' },
    { label: 'Interview', val: apps.interview, color: '#f59e0b' },
    { label: 'Offer',     val: apps.offer,     color: '#10b981' },
    { label: 'Rejected',  val: apps.rejected,  color: '#ef4444' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {items.map(({ label, val, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: '#555' }}><strong style={{ color: '#111' }}>{val}</strong> {label}</span>
        </div>
      ))}
    </div>
  )
}

function UserRow({ user, expanded, onToggle }) {
  const color = hashColor(user.email)
  const name = user.profile?.fullName || '—'

  return (
    <>
      {/* Main row */}
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '1px solid #f5f5f5', background: expanded ? '#fafafa' : '#fff', transition: 'background 0.1s' }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#fafafa' }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = '#fff' }}
      >
        {/* Avatar + email */}
        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials(user.email)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a' }}>{user.email}</div>
              {name !== '—' && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{name}</div>}
            </div>
          </div>
        </td>
        {/* Subscription */}
        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}><Badge active={user.subscriptionActive} /></td>
        {/* Applications */}
        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: user.applications.total > 0 ? '#0a0a0a' : '#ddd' }}>{user.applications.total}</span>
        </td>
        {/* Location */}
        <td className="hide-sm" style={{ padding: '13px 16px', fontSize: 12.5, color: '#888', whiteSpace: 'nowrap' }}>{user.profile?.location || '—'}</td>
        {/* Joined */}
        <td className="hide-sm" style={{ padding: '13px 16px', fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>{fmt(user.createdAt)}</td>
        {/* Chevron */}
        <td style={{ padding: '13px 12px', textAlign: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            <path d="M3 5l4 4 4-4" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
          <td colSpan={6} style={{ padding: '0 16px 20px', background: '#fafafa' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, paddingTop: 16 }}>

              {/* Applications breakdown */}
              <Section title="Applications">
                <AppBreakdown apps={user.applications} />
              </Section>

              {/* Profile */}
              <Section title="Profile">
                <Field label="Name"      val={user.profile?.fullName} />
                <Field label="Phone"     val={user.profile?.phone} />
                <Field label="Location"  val={user.profile?.location} />
                <Field label="LinkedIn"  val={user.profile?.linkedin} />
                <Field label="GitHub"    val={user.profile?.github} />
                <Field label="Portfolio" val={user.profile?.portfolio} />
              </Section>

              {/* Education */}
              <Section title="Education">
                <Field label="University"  val={user.education?.university} />
                <Field label="Degree"      val={user.education?.degree} />
                <Field label="GPA"         val={user.education?.gpa} />
                <Field label="Grad Year"   val={user.education?.graduationYear} />
                <Field label="Field"       val={user.educationField} />
              </Section>

              {/* Skills */}
              <Section title="Skills">
                <Field label="Technical"  val={user.skills?.technical} />
                <Field label="Languages"  val={user.skills?.languages} />
                <Field label="Tools"      val={user.skills?.tools} />
              </Section>

              {/* Job Preferences */}
              <Section title="Job Preferences">
                <Field label="Target Role"   val={user.jobPreferences?.targetRole} />
                <Field label="Exp Level"     val={user.jobPreferences?.experienceLevel} />
                <Field label="Location"      val={user.jobPreferences?.preferredLocation} />
                <Field label="Remote"        val={user.jobPreferences?.remote ? 'Yes' : user.jobPreferences?.remote === false ? 'No' : undefined} />
                <Field label="Salary"        val={user.jobPreferences?.expectedSalary} />
                <Field label="Available"     val={user.jobPreferences?.availableFrom} />
                <Field label="Keywords"      val={user.jobPreferences?.keywords} />
                <Field label="Work Auth"     val={user.jobPreferences?.workAuth} />
                <Field label="Sponsorship"   val={user.jobPreferences?.sponsorship} />
              </Section>

              {/* Stripe */}
              <Section title="Billing">
                <Field label="Stripe ID"  val={user.stripeCustomerId} mono />
                <Field label="Sub ID"     val={user.stripeSubscriptionId} mono />
                <Field label="Joined"     val={fmt(user.createdAt)} />
                <Field label="Updated"    val={fmt(user.updatedAt)} />
              </Section>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  )
}

function Field({ label, val, mono }) {
  if (!val && val !== 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10.5, color: '#bbb', minWidth: 68, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#444', wordBreak: 'break-all', fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</span>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function AdminPage() {
  const [data, setData]       = useState(null)
  const [error, setError]     = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all') // all | active | inactive

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Failed to load'))
  }, [])

  const filtered = (data?.users || []).filter(u => {
    const matchSearch = u.email.includes(search.toLowerCase()) ||
      (u.profile?.fullName || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' ? u.subscriptionActive : !u.subscriptionActive)
    return matchSearch && matchFilter
  })

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#888' }}>
      {error === 'Forbidden' ? '⛔ Admin access only.' : `Error: ${error}`}
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: 20, height: 20, border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const { stats } = data

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8f8f7; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        @media (max-width: 600px) {
          .hide-sm { display: none !important; }
          .admin-title { font-size: 1.3rem !important; }
          .stats-row { gap: 10px !important; }
          .stat-card { padding: 14px 16px !important; }
          .table-wrap { border-radius: 12px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8f8f7', padding: '0 0 60px' }}>

        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/shamrock.svg" width="22" height="22" alt="reblet" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.02em' }}>reblet</span>
            <span style={{ background: '#0a0a0a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6 }}>Admin</span>
          </div>
          <span style={{ fontSize: 12, color: '#bbb' }}>{fmt(new Date())}</span>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 0' }}>

          {/* Page title */}
          <h1 className="admin-title" style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0a', marginBottom: 22 }}>
            Dashboard
          </h1>

          {/* Stats */}
          <div className="stats-row" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <StatCard label="Total Users"      value={stats.totalUsers}          sub="all time" />
            <StatCard label="Active Subs"      value={stats.activeSubscribers}   sub={`${Math.round(stats.activeSubscribers / Math.max(stats.totalUsers,1) * 100)}% conversion`} accent="#16a34a" />
            <StatCard label="Applications"     value={stats.totalApplications.toLocaleString()} sub="submitted via extension" />
            <StatCard label="Monthly Revenue"  value={`$${stats.monthlyRevenue}`} sub="estimated MRR" accent="#8b5cf6" />
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by email or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: '1 1 200px', padding: '9px 14px', border: '1px solid #e8e8e8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
            />
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
                  background: filter === f ? '#0a0a0a' : '#fff',
                  color: filter === f ? '#fff' : '#555',
                  borderColor: filter === f ? '#0a0a0a' : '#e8e8e8',
                }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${data.users.length})`}
                {f === 'active' && ` (${stats.activeSubscribers})`}
                {f === 'inactive' && ` (${data.users.length - stats.activeSubscribers})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="table-wrap" style={{ background: '#fff', borderRadius: 16, border: '1px solid #ebebeb', overflow: 'hidden', boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '11px 16px', textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Apps</th>
                    <th className="hide-sm" style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Location</th>
                    <th className="hide-sm" style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Joined</th>
                    <th style={{ padding: '11px 12px', width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>No users found</td></tr>
                  ) : (
                    filtered.map(u => (
                      <UserRow
                        key={u._id}
                        user={u}
                        expanded={expanded === u._id}
                        onToggle={() => setExpanded(expanded === u._id ? null : u._id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f5f5f5', fontSize: 11.5, color: '#bbb' }}>
              Showing {filtered.length} of {data.users.length} users
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
