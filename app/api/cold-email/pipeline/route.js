import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function extractEmails(text) {
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const found = text.match(re) || []
  const blocked = /\.(png|jpg|jpeg|gif|svg|css|js|woff|ico)$/i
  const generic = /^(no-?reply|support|info|help|admin|webmaster|abuse|postmaster|mailer-daemon|noreply)/i
  return [...new Set(found.filter(e => !blocked.test(e) && !generic.test(e)))]
}

function getDomain(url) {
  try {
    const h = new URL(url).hostname
    const parts = h.replace(/^www\./, '').split('.')
    return parts.length > 2 ? parts.slice(-2).join('.') : h.replace(/^www\./, '')
  } catch { return '' }
}

async function searchJobs(keywords, location, timeRange) {
  const results = []

  async function ddgSearch(query) {
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      })
      const html = await res.text()
      const $ = cheerio.load(html)
      $('.result__a').each((_, el) => {
        let href = $(el).attr('href') || ''
        const uddg = href.match(/uddg=(https?[^&]+)/)
        if (uddg) href = decodeURIComponent(uddg[1])
        if (!href.startsWith('http')) return
        const title = $(el).text().trim()
        if (title && title.length > 5) results.push({ url: href, title })
      })
    } catch (err) {
      console.error('[pipeline] DDG error:', err.message)
    }
  }

  async function bingSearch(query) {
    try {
      const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&count=30`, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      })
      const html = await res.text()
      const $ = cheerio.load(html)
      $('li.b_algo h2 a, .b_algo a').each((_, el) => {
        const href = $(el).attr('href') || ''
        const title = $(el).text().trim()
        if (href.startsWith('http') && title.length > 5) results.push({ url: href, title })
      })
    } catch (err) {
      console.error('[pipeline] Bing error:', err.message)
    }
  }

  async function googleSearch(query) {
    try {
      const res = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' },
      })
      const html = await res.text()
      const $ = cheerio.load(html)
      $('a[href^="/url?"]').each((_, el) => {
        const raw = $(el).attr('href') || ''
        const m = raw.match(/[?&]q=(https?[^&]+)/)
        if (!m) return
        const href = decodeURIComponent(m[1])
        const title = $(el).text().trim()
        if (title.length > 5) results.push({ url: href, title })
      })
    } catch (err) {
      console.error('[pipeline] Google error:', err.message)
    }
  }

  // Strategy: search for COMPANY career/team pages, not job boards
  const queries = [
    // Direct company career pages
    `${keywords} ${location} site:*.com/careers OR site:*.com/jobs`,
    `${keywords} company ${location} "join our team" OR "we're hiring"`,
    // Find companies + team pages with contact info
    `${keywords} ${location} company "about us" OR "our team" recruiter`,
    `${keywords} ${location} startup "open roles" OR "open positions"`,
    // Specific people searches
    `${keywords} ${location} "hiring manager" OR "talent acquisition" OR "head of engineering"`,
    `${keywords} company ${location} CTO OR "VP Engineering" OR "tech lead" email`,
    // Company-specific job posts (not aggregators)
    `${keywords} ${location} "apply now" "send resume" OR "send your resume" email`,
    `${keywords} company ${location} team hiring -indeed -glassdoor -linkedin -monster`,
  ]

  // Wave 1: broad search across all engines
  await Promise.all([
    ddgSearch(queries[0]),
    ddgSearch(queries[1]),
    bingSearch(queries[2]),
    bingSearch(queries[3]),
    googleSearch(queries[4]),
    googleSearch(queries[5]),
  ])

  // Wave 2: more targeted if needed
  if (results.length < 40) {
    await Promise.all([
      ddgSearch(queries[4]),
      ddgSearch(queries[6]),
      bingSearch(queries[5]),
      bingSearch(queries[7]),
      googleSearch(queries[0]),
      googleSearch(queries[1]),
    ])
  }

  // Wave 3: last resort
  if (results.length < 20) {
    await Promise.all([
      ddgSearch(queries[7]),
      bingSearch(queries[1]),
      googleSearch(queries[6]),
      googleSearch(queries[7]),
    ])
  }

  console.log(`[pipeline] Total raw results: ${results.length}`)

  const unique = []
  const seen = new Set()
  const blocked = [
    // Search engines
    'duckduckgo.com', 'bing.com', 'google.com',
    // Social
    'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
    // Reference
    'wikipedia.org', 'reddit.com', 'quora.com',
    // Job boards & aggregators
    'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com', 'monster.com',
    'careerbuilder.com', 'simplyhired.com', 'simplyhired.ca', 'talent.com', 'jooble.org',
    'ca.indeed.com', 'neuvoo.ca', 'jobbank.gc.ca', 'workopolis.com', 'eluta.ca',
    'canadajobs.com', 'itjobsincanada.com', 'csjobs.ca', 'canadiansoftwarejobs.com',
    'career.now', 'jobrapido.com', 'adzuna.ca', 'jobs.ca', 'jobillico.com',
    'wowjobs.ca', 'jobboom.com', 'ca.jora.com', 'betterteam.com', 'lensa.com',
    'salary.com', 'payscale.com', 'comparably.com',
  ]
  for (const r of results) {
    try {
      const domain = new URL(r.url).hostname
      if (!seen.has(domain) && !blocked.some(b => domain.includes(b))) {
        seen.add(domain)
        unique.push(r)
      }
    } catch {}
  }
  return unique.slice(0, 50)
}

async function scrapePage(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)

    $('script, style, noscript, iframe, nav, footer, header').remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()
    const title = $('title').text().trim()
    const h1 = $('h1').first().text().trim()

    const regexEmails = extractEmails(text)
    const mailtoEmails = []
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      const email = href.replace('mailto:', '').split('?')[0].trim()
      if (email && email.includes('@')) mailtoEmails.push(email)
    })

    const allEmails = [...new Set([...regexEmails, ...mailtoEmails])]
    const domain = getDomain(url)

    return { text: text.slice(0, 5000), title, h1, emails: allEmails, domain, url }
  } catch {
    return null
  }
}

async function aiExtractContacts(pages) {
  const batch = pages.map((p, i) => {
    const emailList = p.emails.length > 0 ? `Emails found on page: ${p.emails.join(', ')}` : 'No emails found on page.'
    return `--- PAGE ${i + 1} ---
URL: ${p.url}
Domain: ${p.domain}
Title: ${p.title}
${emailList}
Content (truncated): ${p.text.slice(0, 4000)}
--- END PAGE ${i + 1} ---`
  }).join('\n\n')

  const prompt = `You are an expert cold email researcher. Given scraped company/job pages, find the BEST person or email to cold-email for a job application.

For EACH page:
1. Extract the COMPANY NAME (the actual company, not a job board)
2. Extract the JOB ROLE being advertised
3. Find the BEST email to contact

HOW TO FIND EMAILS — try ALL of these in order:

STEP 1 - FIND REAL PEOPLE on the page:
- Look for ANY person's name mentioned: founders, CEO, CTO, VP Engineering, hiring manager, recruiter, HR director, team lead, "posted by", "contact", author of the post
- Common patterns: "Posted by Jane Smith", "Contact: John Doe", "Questions? Ask Sarah", "Hiring Manager: Mike", "About the author", "Meet our team"
- For startups: founder/CEO names are gold — they often review applications personally

STEP 2 - CONSTRUCT PERSONAL EMAIL from name + domain:
- If you found a name like "Sarah Johnson" and domain is "acme.com":
  → sarah.johnson@acme.com (most common corporate pattern)
  → sarah@acme.com (common at startups)
  → sjohnson@acme.com (common at larger companies)
- Pick the pattern most likely for the company size (startup = first name, corporate = first.last)

STEP 3 - DEPARTMENT EMAILS (if no person found):
- Try these in order: recruiting@, talent@, careers@, jobs@, hiring@, hr@, people@
- Use the company's domain, NOT a job board domain

STEP 4 - LAST RESORT:
- contact@ or info@ with the company domain

CRITICAL RULES:
- NEVER use a job board domain (indeed.com, glassdoor.com, etc.) — only the ACTUAL company domain
- If the page IS a job board listing, extract the company name and guess their domain, then construct an email
- You MUST return an entry for EVERY page — no skipping
- Prefer personal emails over generic ones

Respond in JSON: {"contacts": [...]} where each element is:
{
  "page": 1,
  "company": "Company Name",
  "role": "Job Title",
  "recipientName": "Person's Full Name" or null,
  "recipientTitle": "Their Title" or null,
  "email": "best.email@companydomain.com",
  "confidence": "high" | "medium" | "low"
}

${batch}`

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })
    const parsed = JSON.parse(res.choices[0].message.content)
    if (Array.isArray(parsed)) return parsed
    const firstArrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
    const arr = firstArrayKey ? parsed[firstArrayKey] : []
    console.log(`[pipeline] AI returned ${arr.length} contacts, key: ${firstArrayKey || 'none'}`)
    return arr
  } catch (err) {
    console.error('[pipeline] AI contact extraction error:', err.message)
    return []
  }
}

async function findPeopleAtCompanies(contacts) {
  const companiesNeedingPeople = contacts.filter(c => !c.recipientName && c.company && c.domain)
  if (companiesNeedingPeople.length === 0) return contacts

  const searchPromises = companiesNeedingPeople.slice(0, 15).map(async (contact) => {
    const query = `"${contact.company}" recruiter OR "hiring manager" OR "talent acquisition" OR "HR" email`
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      })
      const html = await res.text()
      const $ = cheerio.load(html)
      const snippets = []
      $('.result__snippet, .result__body').each((_, el) => {
        snippets.push($(el).text().trim())
      })
      return { company: contact.company, domain: contact.domain, snippets: snippets.slice(0, 5).join(' ') }
    } catch {
      return null
    }
  })

  const searchResults = (await Promise.all(searchPromises)).filter(Boolean)
  if (searchResults.length === 0) return contacts

  const prompt = `You are finding real people who work at these companies in HR/recruiting/talent roles.
For each company below, I've included search result snippets. Extract any real person's name and title mentioned.
Then construct their likely email using the company domain and common patterns (firstname.lastname@domain, firstname@domain, flastname@domain).

${searchResults.map((s, i) => `--- COMPANY ${i + 1}: ${s.company} (domain: ${s.domain}) ---
${s.snippets || 'No snippets found'}
--- END ---`).join('\n\n')}

Respond in JSON: {"people": [...]} where each element is:
{
  "company": "Company Name",
  "domain": "company.com",
  "name": "Person's Full Name",
  "title": "Their title",
  "email": "constructed.email@domain.com"
}

Only include people whose names you actually found in the snippets. Do NOT invent names.
If no real person was found for a company, skip it.`

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    })
    const parsed = JSON.parse(res.choices[0].message.content)
    const people = parsed.people || parsed.results || []
    console.log(`[pipeline] People finder found ${people.length} named contacts`)

    const peopleLookup = {}
    for (const p of people) {
      if (p.domain && p.name && p.email) {
        peopleLookup[p.domain] = p
      }
    }

    return contacts.map(c => {
      const person = peopleLookup[c.domain]
      if (person && !c.recipientName) {
        return {
          ...c,
          recipientName: person.name,
          recipientTitle: person.title,
          emails: [person.email],
          confidence: 'medium',
        }
      }
      return c
    })
  } catch (err) {
    console.error('[pipeline] People finder error:', err.message)
    return contacts
  }
}

async function generateEmail(user, job, formData) {
  const userName = formData?.fullName || user.profile?.fullName || user.email.split('@')[0]
  const resumeSnippet = user.resumeText ? user.resumeText.slice(0, 2000) : ''
  const candidateLocation = formData?.location || user.profile?.location || 'Not specified'
  const targetRole = formData?.keywords || user.jobPreferences?.targetRole || 'Not specified'

  const company = job.company || job.pageTitle?.split(/[|\-–—]/)[0]?.trim() || 'your company'
  const recipientName = job.recipientName || null

  const prompt = `Write a short cold email (3-4 sentences) from a job seeker to ${recipientName ? recipientName : 'a hiring manager'}.

Candidate: ${userName}
Email: ${formData?.email || user.email}
LinkedIn: ${formData?.linkedin || user.profile?.linkedin || 'Not provided'}
Location: ${candidateLocation}
Target role: ${targetRole}
Skills: ${user.skills?.technical || ''} ${user.skills?.languages || ''}
${formData?.coverLetter ? `Additional context from candidate: ${formData.coverLetter}` : ''}
Resume excerpt: ${resumeSnippet}

Job title: ${job.role || job.title}
Company name: ${company}
Recipient: ${recipientName ? `${recipientName}${job.recipientTitle ? ` (${job.recipientTitle})` : ''}` : 'Hiring Manager'}

IMPORTANT RULES:
- ${recipientName ? `Address them by name: "Hi ${recipientName.split(' ')[0]},"` : 'Use "Hi there," or "Hello,"'}
- NEVER use placeholder brackets like [Company Name] or [Position] — use the actual company name "${company}" and job title "${job.role || job.title}"
- NEVER include the candidate's phone number or email in the body — only sign off with their name
- Keep it 3-4 sentences max, genuine and concise
- Use "-" instead of "—" (em dash). Avoid overly polished AI-sounding language. Write like a real person texting a professional contact.
- Include greeting, express interest, highlight 1-2 relevant skills, professional sign-off with just the candidate's first name

Respond in JSON: {"subject": "...", "body": "..."}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })
    return JSON.parse(completion.choices[0].message.content)
  } catch {
    return { subject: `Interest in ${job.role || 'open position'}`, body: `Hi,\n\nI came across your posting and I'm very interested. I'd love to discuss how my experience aligns with what you're looking for.\n\nBest,\n${userName}` }
  }
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { timeRange, fullName, email, linkedin, keywords, location, coverLetter } = await request.json()

  await connectDB()
  const user = await User.findById(session.userId).select('email profile resumeText jobPreferences skills')
  if (!user) return new Response('User not found', { status: 404 })

  if (!keywords) {
    return Response.json({ error: 'Job title is required.' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(data) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Stage 1: Search for jobs
        send({ stage: 'searching', message: `Searching for "${keywords}" jobs...` })
        const jobs = await searchJobs(keywords, location, timeRange)
        send({ stage: 'searching', message: `Found ${jobs.length} job postings`, count: jobs.length, jobs: jobs.map(j => ({ url: j.url, title: j.title })) })

        if (jobs.length === 0) {
          send({ stage: 'done', message: 'No jobs found. Try different search terms in Auto Apply settings.', results: [] })
          controller.close()
          return
        }

        // Stage 2: Scrape all pages in parallel batches
        send({ stage: 'extracting', message: 'Visiting job pages to find contacts...' })
        const BATCH_SIZE = 8
        const scrapedPages = []

        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
          const batch = jobs.slice(i, i + BATCH_SIZE)
          send({ stage: 'extracting', message: `Scanning pages ${i + 1}-${Math.min(i + BATCH_SIZE, jobs.length)} of ${jobs.length}...`, progress: Math.round(((i + BATCH_SIZE) / jobs.length) * 100) })

          const batchResults = await Promise.all(batch.map(job => scrapePage(job.url)))
          for (let j = 0; j < batchResults.length; j++) {
            if (batchResults[j]) {
              scrapedPages.push({ ...batchResults[j], originalTitle: batch[j].title })
            }
          }
        }

        send({ stage: 'extracting', message: `Scraped ${scrapedPages.length} pages. Now using AI to find contacts...`, progress: 100 })

        if (scrapedPages.length === 0) {
          send({ stage: 'done', message: 'Could not access any job pages. Try a different search.', results: [] })
          controller.close()
          return
        }

        // Stage 2b: AI contact extraction — process pages in batches of 10
        const AI_BATCH = 5
        const allContacts = []

        for (let i = 0; i < scrapedPages.length; i += AI_BATCH) {
          const batch = scrapedPages.slice(i, i + AI_BATCH)
          send({ stage: 'extracting', message: `AI analyzing pages ${i + 1}-${Math.min(i + AI_BATCH, scrapedPages.length)} for contacts...` })

          const contacts = await aiExtractContacts(batch)
          for (const contact of contacts) {
            const pageIdx = (contact.page || 1) - 1
            const page = batch[pageIdx]
            if (page && contact.email) {
              allContacts.push({
                url: page.url,
                title: page.originalTitle || page.h1 || page.title,
                domain: page.domain,
                company: contact.company || page.title,
                role: contact.role || page.h1 || page.originalTitle,
                emails: [contact.email],
                recipientName: contact.recipientName || null,
                recipientTitle: contact.recipientTitle || null,
                confidence: contact.confidence || 'medium',
                pageTitle: page.title,
              })
            }
          }

          send({ stage: 'extracting', message: `Found ${allContacts.length} contacts so far...`, found: allContacts.length })
        }

        // Also add any pages that had regex emails but AI missed
        const aiUrls = new Set(allContacts.map(c => c.url))
        for (const page of scrapedPages) {
          if (!aiUrls.has(page.url) && page.emails.length > 0) {
            allContacts.push({
              url: page.url,
              title: page.originalTitle || page.h1 || page.title,
              domain: page.domain,
              company: page.title?.split(/[|\-–—]/)[0]?.trim() || '',
              role: page.h1 || page.originalTitle || page.title,
              emails: page.emails.slice(0, 1),
              recipientName: null,
              recipientTitle: null,
              confidence: 'low',
              pageTitle: page.title,
            })
          }
        }

        // Dedupe by email address
        const seenEmails = new Set()
        const dedupedContacts = []
        for (const c of allContacts) {
          const em = c.emails[0]?.toLowerCase()
          if (em && !seenEmails.has(em)) {
            seenEmails.add(em)
            dedupedContacts.push(c)
          }
        }

        send({ stage: 'extracting', message: `Found ${dedupedContacts.length} unique contacts. Searching for real people...`, totalWithEmails: dedupedContacts.length })

        if (dedupedContacts.length === 0) {
          send({ stage: 'done', message: 'No contact emails found. Try a broader search or different keywords.', results: [] })
          controller.close()
          return
        }

        // Stage 2c: Try to find real people at companies with only generic emails
        send({ stage: 'extracting', message: 'Searching for hiring managers and recruiters...' })
        const enrichedContacts = await findPeopleAtCompanies(dedupedContacts)
        const personalCount = enrichedContacts.filter(c => c.recipientName).length
        send({ stage: 'extracting', message: `Found ${personalCount} personal contacts, ${enrichedContacts.length - personalCount} department emails`, totalWithEmails: enrichedContacts.length })

        // Stage 3: Generate emails
        send({ stage: 'generating', message: 'Crafting personalized emails...' })
        const results = []

        for (let i = 0; i < enrichedContacts.length; i++) {
          const job = enrichedContacts[i]
          send({ stage: 'generating', message: `Writing email ${i + 1} of ${enrichedContacts.length}...`, progress: Math.round(((i + 1) / enrichedContacts.length) * 100) })

          const generated = await generateEmail(user, job, { fullName, email: email || user.email, linkedin, keywords, location, coverLetter })
          results.push({
            id: `${Date.now()}-${i}`,
            url: job.url,
            title: job.title,
            role: job.role,
            emails: job.emails,
            subject: generated.subject,
            body: generated.body,
            status: 'ready',
            recipientName: job.recipientName,
            recipientTitle: job.recipientTitle,
            confidence: job.confidence,
            company: job.company,
          })

          send({ stage: 'generating', message: `Email ${i + 1} ready`, generated: results.length })
        }

        // Save to database
        try {
          const docs = results.map(r => ({
            jobUrl: r.url,
            jobTitle: r.role || r.title,
            recipientEmail: r.emails[0],
            subject: r.subject,
            body: r.body,
            status: 'ready',
          }))
          const updated = await User.findByIdAndUpdate(session.userId, { $push: { coldEmails: { $each: docs } } }, { new: true })
          const saved = (updated?.coldEmails || []).slice(-results.length)
          for (let j = 0; j < results.length && j < saved.length; j++) {
            results[j].id = saved[j]._id.toString()
          }
        } catch (e) {
          console.error('[pipeline] save error:', e.message)
        }

        // Stage 4: Ready to send
        send({ stage: 'ready', message: `${results.length} emails ready to send`, results })
        send({ stage: 'done', message: 'Pipeline complete', results })
      } catch (err) {
        console.error('[pipeline] error:', err)
        send({ stage: 'error', message: err.message || 'Pipeline failed' })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
