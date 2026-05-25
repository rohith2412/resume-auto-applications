export const metadata = {
  title: 'Privacy Policy — reblet',
}

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #fff; color: #0a0a0a; -webkit-font-smoothing: antialiased; }
        h1, h2 { font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#0a0a0a', lineHeight: 1.7 }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#888', fontSize: 13, marginBottom: 32 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            reblet.com
          </a>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: '#888', fontSize: 13 }}>Last updated: May 25, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="Overview">
            <P>reblet ("we", "our", or "us") operates the reblet website at reblet.com and the reblet Chrome extension. This Privacy Policy explains how we collect, use, and protect your information when you use our services.</P>
          </Section>

          <Section title="Information We Collect">
            <P><strong>Account information:</strong> When you create an account, we collect your email address and a hashed password.</P>
            <P><strong>Profile information:</strong> Information you optionally provide such as your name, phone number, location, LinkedIn URL, and GitHub URL to personalise your job applications.</P>
            <P><strong>Resume data:</strong> Resume text you upload or create, used solely to auto-fill job applications on your behalf.</P>
            <P><strong>Usage data:</strong> Information about applications submitted through the extension, including job titles, company names, and application status.</P>
            <P><strong>Payment information:</strong> Payments are processed by Stripe. We do not store your card details. We only store your Stripe customer ID and subscription status.</P>
          </Section>

          <Section title="How We Use Your Information">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'To auto-fill and submit LinkedIn Easy Apply job applications on your behalf',
                'To manage your account and subscription',
                'To provide your application tracking dashboard',
                'To communicate important account and service updates',
                'To improve our services',
              ].map((item, i) => <li key={i} style={{ fontSize: 15, color: '#444' }}>{item}</li>)}
            </ul>
          </Section>

          <Section title="Chrome Extension">
            <P>The reblet Chrome extension accesses LinkedIn job listing pages solely to auto-fill and submit Easy Apply job applications using the profile information you have provided. The extension does not read, store, or transmit any data from pages other than LinkedIn job listings.</P>
            <P>The extension communicates only with reblet.com servers to retrieve your profile and log application activity.</P>
          </Section>

          <Section title="Data Sharing">
            <P>We do not sell, rent, or share your personal information with third parties except:</P>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                'Stripe — to process subscription payments',
                'MongoDB Atlas — to store your account and application data securely',
                'If required by law or to protect our legal rights',
              ].map((item, i) => <li key={i} style={{ fontSize: 15, color: '#444' }}>{item}</li>)}
            </ul>
          </Section>

          <Section title="Data Security">
            <P>Your password is hashed using bcrypt and never stored in plain text. All data is transmitted over HTTPS. We use industry-standard security practices to protect your information.</P>
          </Section>

          <Section title="Data Retention">
            <P>We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us at the email below.</P>
          </Section>

          <Section title="Your Rights">
            <P>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at <a href="mailto:support@reblet.com" style={{ color: '#0a0a0a', fontWeight: 500 }}>support@reblet.com</a>.</P>
          </Section>

          <Section title="Children's Privacy">
            <P>reblet is not directed to children under 13. We do not knowingly collect personal information from children under 13.</P>
          </Section>

          <Section title="Changes to This Policy">
            <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date.</P>
          </Section>

          <Section title="Contact">
            <P>If you have any questions about this Privacy Policy, please contact us at:</P>
            <p style={{ fontSize: 15, color: '#444', marginTop: 8 }}>
              <strong>reblet</strong><br />
              <a href="mailto:support@reblet.com" style={{ color: '#0a0a0a' }}>support@reblet.com</a><br />
              reblet.com
            </p>
          </Section>

        </div>
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function P({ children }) {
  return <p style={{ fontSize: 15, color: '#444', lineHeight: 1.75 }}>{children}</p>
}
