import OpenAI from 'openai'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS() { return corsOk() }

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { profile: 1, education: 1, skills: 1, jobPreferences: 1, resumeText: 1 } }
  )
  if (!user) return corsJson({ error: 'Invalid API key' }, { status: 401 })

  const { jobTitle, company, jobDescription, questions = [] } = await request.json()
  if (!questions.length) return corsJson({ answers: [] })

  const p  = user.profile        || {}
  const ed = user.education       || {}
  const sk = user.skills          || {}
  const jp = user.jobPreferences  || {}

  const profileSnap = [
    p.fullName       && `Full name: ${p.fullName}`,
    p.location       && `Location: ${p.location}`,
    p.phone          && `Phone: ${p.phone}`,
    p.linkedin       && `LinkedIn: ${p.linkedin}`,
    p.github         && `GitHub: ${p.github}`,
    ed.university    && `Education: ${ed.degree || 'Bachelor\'s'} at ${ed.university}${ed.graduationYear ? `, graduating ${ed.graduationYear}` : ''}`,
    ed.gpa           && `GPA: ${ed.gpa}`,
    jp.yearsExp      && `Years of experience: ${jp.yearsExp}`,
    jp.workAuth      && `Work authorization: ${jp.workAuth}`,
    jp.sponsorship   && `Needs sponsorship: ${jp.sponsorship}`,
    jp.expectedSalary && `Expected salary: ${jp.expectedSalary}`,
    jp.noticePeriod  && `Notice period: ${jp.noticePeriod}`,
    sk.languages     && `Programming languages: ${sk.languages}`,
    sk.tools         && `Tools & frameworks: ${sk.tools}`,
    sk.technical     && `Technical skills: ${sk.technical}`,
    user.resumeText  && `\nFull resume:\n${user.resumeText.slice(0, 3000)}`,
  ].filter(Boolean).join('\n')

  const questionBlock = questions.map((q, i) => {
    let line = `${i + 1}. [${q.type || 'text'}] ${q.label}`
    if (q.options?.length) line += `\n   Options: ${q.options.join(' | ')}`
    return line
  }).join('\n')

  const today = new Date().toISOString().slice(0, 10)
  const startDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })()

  const prompt = `You are an expert job application AI filling out a LinkedIn Easy Apply form. Use the applicant's real data to give accurate, specific answers — never generic placeholders.

TODAY: ${today}

═══ JOB ═══
Title: ${jobTitle}
Company: ${company}
${jobDescription ? `Description:\n${jobDescription.slice(0, 1500)}` : ''}

═══ APPLICANT ═══
${profileSnap}

═══ FORM QUESTIONS ═══
${questionBlock}

═══ INSTRUCTIONS ═══
Return ONLY a JSON array, one object per question:
[{"label": "<exact label from above>", "answer": "<value>"}]

RULES BY FIELD TYPE
• text / textarea — specific, professional answer drawn from resume. For behavioral/example questions write 2-3 sentences with a concrete result (use numbers/metrics if in resume). Never say "I am excited" or vague fluff.
• select / radio — return the EXACT option text that best matches. Never invent options.
• checkbox — comma-separated option texts to check. "none" if truly none apply.
• number — digits only (e.g. "3")
• date (YYYY-MM-DD) — use ${startDate} for start/availability questions
• month (YYYY-MM) — use ${startDate.slice(0,7)} for graduation/availability months
• years of experience — honest integer from resume, as string (e.g. "2")
• salary / pay / compensation — digits only (e.g. "85000")

SPECIFIC ANSWER RULES
• Work authorization / eligible to work → use profile value, default "Yes"
• Visa sponsorship needed → use profile value, default "No"
• Referral / referred by employee → always "No"
• Previously worked here / at this company → always "No"
• Background check / drug test / consent / acknowledge → always "Yes"
• Gender / race / ethnicity / veteran / disability / EEO → always "Prefer not to say" or "Decline to self-identify"
• Language proficiency → "Native or Bilingual" if English, else "Full Professional Working"
• How did you hear about us → "LinkedIn"
• Willing to relocate / travel / work on-site → "Yes"
• Notice period / when can you start → use profile notice period, default "2 weeks"
• Certifications (specific cert asked) → "No" unless cert is explicitly in resume
• "Please specify" follow-up field → leave blank ("") unless context is clear
• Cover letter / why this role — 2 sentences max, mention job title + one specific skill from resume

Return ONLY the JSON array. No markdown. No explanation.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0].message.content?.trim() || '{}'
    // response_format:json_object wraps in an object — extract the array
    let answers = []
    try {
      const parsed = JSON.parse(raw)
      answers = Array.isArray(parsed) ? parsed : (parsed.answers || parsed.fields || Object.values(parsed)[0] || [])
    } catch {
      const arrStr = raw.match(/\[[\s\S]*\]/)?.[0] || '[]'
      answers = JSON.parse(arrStr)
    }
    return corsJson({ answers })
  } catch (e) {
    console.error('extension/tailor error', e)
    return corsJson({ answers: [] })
  }
}
