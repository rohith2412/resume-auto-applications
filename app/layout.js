import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const SITE_URL  = 'https://www.reblet.com'
const SITE_NAME = 'reblet'
const OG_IMAGE  = `${SITE_URL}/og-image.png`

// ════════════════════════════════════════════════════════════════════════════
//  SEO METADATA — keyword-optimized for LinkedIn auto-apply / AI job search
// ════════════════════════════════════════════════════════════════════════════
export const metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Primary title & description ──
  title: {
    default:  'reblet — LinkedIn Auto Apply Bot | AI Easy Apply Chrome Extension',
    template: '%s | reblet',
  },
  description:
    'Auto apply to LinkedIn jobs with AI. reblet is the smart Chrome extension that fills out Easy Apply forms, tailors your resume to each job, and submits applications automatically. Apply to 40+ jobs a day on autopilot.',

  // ── Keywords (low SEO weight today, but still indexed by some engines) ──
  keywords: [
    'LinkedIn auto apply',
    'LinkedIn auto apply bot',
    'auto apply jobs',
    'LinkedIn Easy Apply bot',
    'LinkedIn Easy Apply automation',
    'AI job application',
    'AI job application bot',
    'auto apply chrome extension',
    'LinkedIn job bot',
    'job application automation',
    'AI resume tailor',
    'AI cover letter generator',
    'auto job search',
    'LinkedIn automation',
    'auto submit job application',
    'apply to jobs automatically',
    'mass apply jobs',
    'bulk apply LinkedIn',
    'AI job search assistant',
    'automated job application',
    'LinkedIn apply bot 2026',
    'easy apply automation',
    'reblet',
    'reblet extension',
    'reblet auto apply',
    'job hunting AI',
    'one click apply jobs',
    'AI resume builder',
    'ATS resume optimizer',
    'AI cover letter',
    'LinkedIn premium alternative',
  ],

  // ── Authors / publisher ──
  authors: [{ name: 'reblet' }],
  creator: 'reblet',
  publisher: 'reblet',

  // ── Robots (let Google index everything) ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // ── Canonical & alternates ──
  alternates: {
    canonical: SITE_URL,
  },

  // ── OpenGraph (LinkedIn / Facebook / iMessage previews) ──
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'reblet — LinkedIn Auto Apply Bot | AI Easy Apply Chrome Extension',
    description:
      'Auto apply to LinkedIn jobs with AI. The smart Chrome extension that fills Easy Apply forms, tailors your resume per job, and submits applications automatically. Apply to 40+ jobs a day on autopilot.',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'reblet — LinkedIn Auto Apply Chrome Extension powered by AI',
      },
    ],
  },

  // ── Twitter / X card ──
  twitter: {
    card: 'summary_large_image',
    title: 'reblet — LinkedIn Auto Apply Bot | AI Easy Apply',
    description:
      'Auto apply to LinkedIn jobs with AI. Chrome extension fills Easy Apply forms, tailors your resume per job, and submits for you. 40+ jobs/day on autopilot.',
    images: [OG_IMAGE],
    creator: '@reblet',
  },

  // ── Icons / manifest ──
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },

  // ── Category (helps app stores / search engines classify) ──
  category: 'productivity',

  // ── App store deep links (if you ever publish a mobile app) ──
  applicationName: 'reblet',
  referrer: 'origin-when-cross-origin',

  // ── Format detection ──
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // ── Verification (fill these in once you have them) ──
  verification: {
    // google: 'your-google-site-verification-token',
    // yandex: 'your-yandex-verification-token',
  },
}

// ════════════════════════════════════════════════════════════════════════════
//  STRUCTURED DATA (JSON-LD) — for Google rich results
//  SoftwareApplication schema gets you a card in search results with
//  ratings, price, install link, etc.
// ════════════════════════════════════════════════════════════════════════════
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    // The SaaS / extension itself
    {
      '@type':            'SoftwareApplication',
      '@id':              `${SITE_URL}/#software`,
      name:               'reblet — LinkedIn Auto Apply Bot',
      alternateName:      ['reblet', 'reblet auto apply', 'reblet extension'],
      applicationCategory:'BrowserExtension',
      operatingSystem:    'Chrome, Edge, Brave, Arc',
      url:                SITE_URL,
      downloadUrl:        'https://chrome.google.com/webstore/detail/reblet/pncleeecacohjhfkcgebaiepnjahbhip',
      description:
        'AI-powered Chrome extension that auto-applies to LinkedIn Easy Apply jobs. Tailors your resume to each job description, auto-fills application forms, and submits on your behalf. Apply to up to 40 jobs a day on autopilot.',
      featureList: [
        'Auto apply to LinkedIn Easy Apply jobs',
        'AI-tailored resume for each application',
        'AI-generated cover letters',
        '1,200+ pre-seeded answers to common application questions',
        'Smart Q&A engine that handles custom employer questions',
        'Safe human-emulation mode to avoid bot detection',
        'Application tracker with applied / skipped / interview / offer status',
        'Per-day caps and time-of-day safety controls',
      ],
      offers: {
        '@type':         'Offer',
        price:           '20',
        priceCurrency:   'USD',
        availability:    'https://schema.org/InStock',
        priceValidUntil: '2026-12-31',
      },
      aggregateRating: {
        '@type':      'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '120',
      },
      author: {
        '@type': 'Organization',
        name:    'reblet',
        url:     SITE_URL,
      },
    },

    // The organization / brand
    {
      '@type':     'Organization',
      '@id':       `${SITE_URL}/#organization`,
      name:        'reblet',
      url:         SITE_URL,
      logo:        `${SITE_URL}/shamrock.svg`,
      sameAs: [
        'https://chrome.google.com/webstore/detail/reblet/pncleeecacohjhfkcgebaiepnjahbhip',
      ],
    },

    // The website itself
    {
      '@type':     'WebSite',
      '@id':       `${SITE_URL}/#website`,
      url:         SITE_URL,
      name:        'reblet',
      description: 'LinkedIn auto-apply Chrome extension powered by AI',
      publisher:   { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type':      'SearchAction',
        target:       `${SITE_URL}/search?q={search_term}`,
        'query-input':'required name=search_term',
      },
    },

    // FAQ rich snippet — gets you the expandable Q&A in Google search
    {
      '@type': 'FAQPage',
      '@id':   `${SITE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name:    'What is reblet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'reblet is a Chrome extension that auto-applies to LinkedIn Easy Apply jobs on your behalf using AI. It reads each job description, tailors your resume to match, fills out the Easy Apply form, and submits the application automatically.',
          },
        },
        {
          '@type': 'Question',
          name:    'How does the LinkedIn auto-apply bot work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'After you install the Chrome extension and connect your reblet account, you click "Start Auto Apply" on the LinkedIn jobs search page. The bot opens each job, reads the description, fills in the Easy Apply form with answers tailored to your profile, and submits the application — all automatically.',
          },
        },
        {
          '@type': 'Question',
          name:    'Is using an auto-apply bot safe on LinkedIn?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'reblet uses a human-emulation layer with randomized timing, mouse-curve clicks, typing rhythm, and built-in daily caps to behave like a real user. It enforces a safe limit of 40 applications per day and only runs during normal hours, which keeps you well within LinkedIn\'s typical usage patterns.',
          },
        },
        {
          '@type': 'Question',
          name:    'How many jobs can I apply to per day?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'reblet defaults to a safe 40 applications per day with 8 per hour, spread across multiple sessions. This is well below LinkedIn\'s bot-detection thresholds while still applying to dramatically more jobs than you could manually.',
          },
        },
        {
          '@type': 'Question',
          name:    'Does reblet work for non-technical roles?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. reblet comes with 1,200+ pre-seeded answers covering questions across software engineering, sales, marketing, product management, design, finance, healthcare, and more. The AI fallback handles any custom employer questions the seeded answers don\'t cover.',
          },
        },
        {
          '@type': 'Question',
          name:    'How much does reblet cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'reblet starts at $20/month with unlimited LinkedIn Easy Apply automation, AI-tailored resume per job, cover letter generation, and the application tracker.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* JSON-LD structured data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        {/* Extra meta tags Next.js metadata doesn't fully cover */}
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="color-scheme" content="light" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://chrome.google.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
