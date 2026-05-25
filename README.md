# theQuickResume — AI-Powered Resume Builder

A full-featured AI resume builder with real-time preview, scoring, and cover letter generation.

## Features

- **Resume builder** — Step-by-step guided editor with sections for experience, education, skills, projects, and certifications
- **Live preview** — See your resume update in real time as you type, in 3 professional templates (Classic, Modern, Minimal)
- **AI bullet points** — Generate or improve bullet points with one click using GPT-4o
- **Resume score** — AI rates your resume 0–100 across ATS compatibility, impact, completeness, and keywords
- **Tailor to job** — Paste any job description; AI rewrites your resume to match it exactly
- **Cover letter** — Generates a personalized cover letter from your resume + job description
- **PDF export** — Download a clean PDF in your chosen template via the browser print dialog
- **Multiple resumes** — Create, duplicate, and manage separate resumes for different applications
- **History** — All previously tailored resumes are saved and downloadable
- **Auth** — Email/password signup and login (JWT + MongoDB)
- **Paywall** — Stripe subscription in production (bypassed in development)

## Tech Stack

- **Next.js 16** (App Router)
- **MongoDB + Mongoose**
- **OpenAI GPT-4o** (tailoring, scoring, bullet improvement, cover letters)
- **Stripe** (subscription billing)
- **jsPDF** (PDF download fallback)
- **bcryptjs + jose** (auth)

## Getting Started

### 1. Clone and install

```bash
git clone <repo>
cd resume-rewriter
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
MONGODB_URI=mongodb+srv://...          # MongoDB Atlas connection string
NEXTAUTH_SECRET=your-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-...                  # OpenAI API key (GPT-4o required)
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret (optional in dev)
STRIPE_PRICE_ID=price_...             # Stripe price ID (optional in dev)
STRIPE_WEBHOOK_SECRET=whsec_...       # Stripe webhook secret (optional in dev)
```

> **Note:** Stripe is only required in production. In development, the paywall is bypassed automatically.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. First-time setup

1. Click **Get started free** to create an account
2. Complete the 3-step onboarding (name, job preferences, resume upload)
3. You'll land on the **My Resumes** dashboard
4. Click **+ New Resume** to create your first resume
5. Use the **Build** tab to add your experience, education, and skills
6. Use the **Preview** tab to score your resume and download PDF
7. Use the **Tailor to Job** tab to match a specific job description
8. Use the **Cover Letter** tab to generate a cover letter

## Project Structure

```
app/
  api/
    auth/           # Login, signup, logout, session
    history/        # Tailored resume history
    profile/        # User profile CRUD
    resume/         # PDF upload + legacy tailor
    resumes/        # Full resume CRUD
      [id]/
        improve/    # AI bullet/summary improvement
        score/      # AI resume scoring
        cover-letter/ # Cover letter generation
        tailor/     # Job description tailoring
    stripe/         # Checkout + webhook
  components/
    TailorPage.js   # Main app shell + Dashboard + History + Profile
    ResumeEditor.js # Full resume editor (Build/Preview/Tailor/Cover Letter tabs)
    ResumePreview.js # Template renderers (Classic/Modern/Minimal) + PDF export
    AuthModal.js    # Login/signup modal
    BlurredPreview.js # Landing page
    Toast.js        # Toast notifications
  onboarding/       # 3-step onboarding flow
  paywall/          # Stripe subscription page
  globals.css       # Global styles + design system
  layout.js
  page.js           # Root: redirects to dashboard or shows landing page
lib/
  auth.js           # JWT session helpers
  mongodb.js        # Mongoose connection
  parsePdf.cjs      # PDF text extraction
models/
  User.js           # User schema (profile, education, skills, history)
  Resume.js         # Resume schema (all sections + AI results)
```

## Example Resume Data

When testing, create a resume with:

**Personal Info:**
- Name: Jane Doe
- Email: jane@email.com
- Location: San Francisco, CA
- LinkedIn: linkedin.com/in/janedoe

**Experience:**
- Software Engineer @ Google (2022–Present)
  - Built internal tooling used by 2,000+ engineers, reducing deployment time by 40%
  - Led migration from monolith to microservices architecture across 3 teams

**Education:**
- B.S. Computer Science, Stanford University, 2022

**Skills:** Python, TypeScript, React, PostgreSQL, Docker, AWS

Then use **Score my resume** in the Preview tab, and **Tailor to Job** with any job description.

## Production Deployment

1. Deploy to Vercel (recommended) or any Node.js host
2. Set all environment variables in your hosting dashboard
3. Configure Stripe webhook endpoint: `POST /api/stripe/webhook`
4. Set `NEXTAUTH_URL` to your production domain
# resume-auto-applications
