'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ToastProvider, useToast } from './Toast'
import { UserContext } from './UserContext'

function BriefcaseIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h2A1.5 1.5 0 0 1 10 3.5V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M1.5 9h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function BoltIcon() { return <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 -960 960 960" width="15" fill="currentColor"><path d="M160-120v-200q0-33 23.5-56.5T240-400h480q33 0 56.5 23.5T800-320v200H160Zm200-320q-83 0-141.5-58.5T160-640q0-83 58.5-141.5T360-840h240q83 0 141.5 58.5T800-640q0 83-58.5 141.5T600-440H360ZM240-200h480v-120H240v120Zm120-320h240q50 0 85-35t35-85q0-50-35-85t-85-35H360q-50 0-85 35t-35 85q0 50 35 85t85 35Zm28.5-91.5Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm240 0Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5ZM480-200Zm0-440Z"/></svg> }
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 9.5L12.5 7l-3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }

const NAV = [
  { id: 'applications', label: 'Applications', href: '/my-resumes/applications', icon: <BriefcaseIcon /> },
  { id: 'auto-apply',   label: 'Auto Apply',   href: '/my-resumes/auto-apply',   icon: <BoltIcon /> },
  { id: 'profile',      label: 'Profile',      href: '/my-resumes/profile',      icon: <UserIcon /> },
]

function Shell({ user, children }) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToast()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  async function handleLogout() {
    setShowLogoutConfirm(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  function isActive(href) { return pathname === href || pathname.startsWith(href + '/') }

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
          text-decoration: none;
        }
        .app-nav-item:hover { background: #f7f7f5; color: #0a0a0a; }
        .app-nav-item.active { background: #f7f7f5; color: #0a0a0a; }
      `}</style>

      <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>

        {/* Sidebar */}
        <aside className="sidebar" style={{ width: '224px', minHeight: '100vh', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, background: '#fff', zIndex: 40 }}>
          <div style={{ padding: '1.125rem 1rem 0.875rem', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/shamrock.svg" width="26" height="26" alt="reblet" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500, fontSize: '14px', letterSpacing: '-0.02em' }}>reblet</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '0.625rem 0.75rem' }}>
            {NAV.map(n => (
              <Link key={n.id} href={n.href} className={`app-nav-item${isActive(n.href) ? ' active' : ''}`}>
                {n.icon}{n.label}
              </Link>
            ))}
          </nav>
          <div style={{ padding: '0.875rem', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '0.75rem', color: '#bbb', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.25rem' }}>
              {user.email}
            </div>
            <button onClick={() => setShowLogoutConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#888', padding: '0.375rem 0.5rem', borderRadius: '6px', width: '100%', fontFamily: 'inherit', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f5'; e.currentTarget.style.color = '#0a0a0a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
            >
              <LogoutIcon /> Log out
            </button>
          </div>
        </aside>

        {/* Mobile nav */}
        <nav className="mobile-nav">
          {NAV.map(n => (
            <Link key={n.id} href={n.href} className={`mobile-nav-btn${isActive(n.href) ? ' active' : ''}`}>
              {n.icon}<span>{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* Main */}
        <main className="sidebar-main" style={{ marginLeft: '224px', flex: 1, minHeight: '100vh' }}>
          {children}
        </main>
      </div>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div onClick={() => setShowLogoutConfirm(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e0', padding: '2rem', width: '100%', maxWidth: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', textAlign: 'center' }}
          >
            <div style={{ width: 44, height: 44, background: '#f7f7f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <LogoutIcon />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Log out?</h3>
            <p style={{ fontSize: '13px', color: '#888', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.75rem' }}>
              You&apos;ll be signed out. Any unsaved changes will be lost.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '11px', background: 'transparent', color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
              >Cancel</button>
              <button onClick={handleLogout}
                style={{ flex: 1, padding: '11px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}
              >Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AppShellLayout({ user, children }) {
  return (
    <UserContext.Provider value={user}>
      <ToastProvider>
        <Shell user={user} children={children} />
      </ToastProvider>
    </UserContext.Provider>
  )
}
