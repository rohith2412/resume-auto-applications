import { useState } from "react";

const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
    fontFamily: "'DM Sans', 'Inter', sans-serif",
  },
  card: {
    width: "100%", maxWidth: "420px",
    background: "#111",
    borderRadius: "20px",
    border: "1px solid #2a2a2a",
    overflow: "hidden",
  },
  cardTop: {
    padding: "2rem 2rem 1.5rem",
    borderBottom: "1px solid #1e1e1e",
  },
  brandRow: {
    display: "flex", alignItems: "center", gap: "8px",
    marginBottom: "1.75rem",
  },
  brandMark: {
    width: "26px", height: "26px",
    background: "#fff", borderRadius: "6px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    fontSize: "12px", fontWeight: 500,
    color: "#fff", letterSpacing: "0.04em",
  },
  closeBtn: {
    marginLeft: "auto", background: "none", border: "none",
    cursor: "pointer", color: "#555", fontSize: "22px",
    lineHeight: 1, display: "flex", alignItems: "center", padding: "2px",
  },
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.6rem", fontWeight: 800,
    color: "#f5f5f0", letterSpacing: "-0.03em",
    lineHeight: 1.15, marginBottom: "6px",
    margin: "0 0 6px",
  },
  headingEm: { fontStyle: "italic", color: "#888" },
  subheading: {
    fontSize: "13px", color: "#555",
    fontWeight: 300, letterSpacing: "0.01em",
    margin: 0,
  },
  body: {
    padding: "1.75rem 2rem 2rem",
    display: "flex", flexDirection: "column", gap: "1rem",
  },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "11px", fontWeight: 500, color: "#444",
    letterSpacing: "0.1em", textTransform: "uppercase",
  },
  input: {
    width: "100%", background: "#0a0a0a",
    border: "1px solid #222", borderRadius: "10px",
    padding: "11px 14px", fontSize: "13.5px",
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    color: "#f0f0f0", outline: "none",
    boxSizing: "border-box",
    appearance: "none", WebkitAppearance: "none",
  },
  inputPw: {
    width: "100%", background: "#0a0a0a",
    border: "1px solid #222", borderRadius: "10px",
    padding: "11px 2.75rem 11px 14px", fontSize: "13.5px",
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    color: "#f0f0f0", outline: "none",
    boxSizing: "border-box",
    appearance: "none", WebkitAppearance: "none",
  },
  pwWrap: { position: "relative" },
  pwToggle: {
    position: "absolute", right: "12px", top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    color: "#555", fontSize: "15px",
    display: "flex", alignItems: "center", padding: "0",
  },
  error: {
    background: "#1a0a0a", border: "1px solid #3a1414",
    borderRadius: "8px", padding: "10px 13px",
    fontSize: "13px", color: "#c0504a",
  },
  divider: { display: "flex", alignItems: "center", gap: "12px" },
  dividerLine: { flex: 1, height: "1px", background: "#1e1e1e" },
  dividerText: { fontSize: "11px", color: "#333", letterSpacing: "0.06em" },
  submit: {
    width: "100%", padding: "13px",
    background: "#f5f5f0", color: "#0a0a0a",
    border: "none", borderRadius: "10px",
    fontSize: "13.5px", fontWeight: 500,
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    cursor: "pointer", letterSpacing: "-0.01em",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  submitDisabled: {
    width: "100%", padding: "13px",
    background: "#f5f5f0", color: "#0a0a0a",
    border: "none", borderRadius: "10px",
    fontSize: "13.5px", fontWeight: 500,
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    cursor: "not-allowed", letterSpacing: "-0.01em",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: 0.5,
  },
  switchRow: {
    textAlign: "center", fontSize: "12.5px",
    color: "#444", paddingTop: "0.25rem",
  },
  switchBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#888", fontFamily: "'DM Sans', 'Inter', sans-serif",
    fontSize: "12.5px", fontWeight: 500,
    textDecoration: "underline", textUnderlineOffset: "2px",
    padding: 0,
  },
  footer: {
    padding: "1rem 2rem",
    borderTop: "1px solid #191919",
    display: "flex", alignItems: "center", gap: "8px",
  },
  footerText: { fontSize: "11px", color: "#383838", letterSpacing: "0.03em" },
};

export default function AuthModal({ onClose, initialMode = "login", onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
      if (onSuccess) onSuccess(data);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  function switchMode() { setMode(m => m === "login" ? "signup" : "login"); setError(""); }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes qr-spin { to { transform: rotate(360deg); } }
        .qr-spinner {
          width: 16px; height: 16px;
          border: 2px solid #0a0a0a;
          border-top-color: transparent;
          border-radius: 50%;
          animation: qr-spin 0.7s linear infinite;
          display: inline-block;
        }
      `}</style>

      <div style={S.overlay} onClick={onClose}>
        <div style={S.card} onClick={e => e.stopPropagation()}>

          <div style={S.cardTop}>
            <div style={S.brandRow}>
              <img src="/shamrock.svg" width="22" height="22" alt="reblet" style={{ flexShrink: 0, filter: 'invert(1)' }} />
              <span style={S.brandName}>reblet</span>
              <button style={S.closeBtn} onClick={onClose} aria-label="Close">&times;</button>
            </div>

            <h2 style={S.heading}>
              {mode === "login" ? <>Welcome <em style={S.headingEm}>back.</em></> : <>Create an <em style={S.headingEm}>account.</em></>}
            </h2>
            <p style={S.subheading}>
              {mode === "login" ? "Log in to continue building." : "Start building your resume today."}
            </p>
          </div>

          <form style={S.body} onSubmit={handleSubmit}>
            <div style={S.field}>
              <span style={S.label}>Email</span>
              <input
                style={S.input}
                type="email" required autoFocus
                placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div style={S.field}>
              <span style={S.label}>Password</span>
              <div style={S.pwWrap}>
                <input
                  style={S.inputPw}
                  type={showPw ? "text" : "password"} required
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  minLength={mode === "signup" ? 8 : 1}
                />
                <button type="button" style={S.pwToggle} onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                  {showPw ? (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div style={S.error}>{error}</div>}

            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={S.dividerText}>or continue with</span>
              <div style={S.dividerLine} />
            </div>

            <button type="submit" style={loading ? S.submitDisabled : S.submit} disabled={loading}>
              {loading ? <span className="qr-spinner" /> : mode === "login" ? "Log in" : "Create account"}
            </button>

            <div style={S.switchRow}>
              <span>{mode === "login" ? "Don't have an account? " : "Already have an account? "}</span>
              <button type="button" style={S.switchBtn} onClick={switchMode}>
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </div>
          </form>

          <div style={S.footer}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: "#383838", flexShrink: 0 }}>
              <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={S.footerText}>256-bit encrypted &nbsp;&middot;&nbsp; Never shared &nbsp;&middot;&nbsp; Cancel anytime</span>
          </div>

        </div>
      </div>
    </>
  );
}