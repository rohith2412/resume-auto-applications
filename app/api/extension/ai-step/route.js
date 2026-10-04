import OpenAI from 'openai'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { corsJson, corsOk } from '@/lib/extensionCors'
import { rateLimit } from '@/lib/rateLimit'

const limiter = rateLimit({ max: 30, windowMs: 60_000 })

export async function OPTIONS(request) { return corsOk(request) }

export async function POST(request) {
  const limited = limiter(request)
  if (limited) return limited

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson(request, { error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { profile: 1, education: 1, skills: 1, jobPreferences: 1, resumeText: 1 } }
  )
  if (!user) return corsJson(request, { error: 'Invalid API key' }, { status: 401 })

  const { jobTitle, company, stepFields = [], errorFields = [] } = await request.json()
  if (stepFields.length > 50) return corsJson(request, { error: 'Too many fields' }, { status: 400 })

  const p  = user.profile       || {}
  const ed = user.education      || {}
  const sk = user.skills         || {}
  const jp = user.jobPreferences || {}

  const profileSnap = [
    p.fullName       && `Full name: ${p.fullName}`,
    p.location       && `Location: ${p.location}`,
    ed.university    && `Education: ${ed.degree || 'Bachelor\'s'} at ${ed.university}${ed.graduationYear ? `, ${ed.graduationYear}` : ''}`,
    ed.gpa           && `GPA: ${ed.gpa}`,
    jp.yearsExp      && `Years of experience: ${jp.yearsExp}`,
    jp.workAuth      && `Work authorization: ${jp.workAuth}`,
    jp.sponsorship   && `Needs sponsorship: ${jp.sponsorship}`,
    jp.expectedSalary && `Expected salary: ${jp.expectedSalary}`,
    sk.languages     && `Languages: ${sk.languages}`,
    sk.tools         && `Tools: ${sk.tools}`,
    sk.technical     && `Domain: ${sk.technical}`,
    user.resumeText  && `\nResume:\n${user.resumeText.slice(0, 2500)}`,
  ].filter(Boolean).join('\n')

  const fieldBlock = stepFields.map((f, i) => {
    let line = `${i + 1}. [${f.type}] "${f.label}"`
    if (f.currentValue) line += ` — currently: "${f.currentValue}"`
    if (f.hasError)     line += ' ⚠ HAS VALIDATION ERROR'
    if (f.options?.length) line += `\n   Options: ${f.options.join(' | ')}`
    if (f.placeholder) line += `\n   Placeholder: ${f.placeholder}`
    return line
  }).join('\n')

  const prompt = `You are an expert job application assistant. A LinkedIn Easy Apply form step could not be auto-filled correctly and has validation errors. Analyze every field and return the correct value for each.

JOB: ${jobTitle || 'Unknown'} at ${company || 'Unknown'}

APPLICANT PROFILE
${profileSnap}

CURRENT FORM STEP — ALL FIELDS
${fieldBlock}

${errorFields.length ? `FIELDS WITH VALIDATION ERRORS: ${errorFields.join(', ')}` : ''}

TASK
Return a JSON array with an answer for every field that needs a value. Focus especially on the fields with validation errors.

[{"label": "<exact field label>", "answer": "<value to fill>"}]

Rules:
- text/textarea: specific answer from resume, max 2 sentences
- select/radio: EXACT option text from the listed options
- checkbox: comma-separated option texts to check, or "none"
- number: digits only
- date: YYYY-MM-DD format
- month: YYYY-MM format
- If a field already has a correct value and no error, still include it with the same value
- work authorization: default "Yes"
- sponsorship: default "No"
- referral: always "No"
- demographics (race/gender/veteran/disability): "Prefer not to say"
- salary: digits only

Return ONLY the JSON array. No markdown, no explanation.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.1,
    })
    const raw = completion.choices[0].message.content?.trim() || '[]'
    const arrStr = raw.match(/\[[\s\S]*\]/)?.[0] || '[]'
    const answers = JSON.parse(arrStr)
    return corsJson(request, { answers })
  } catch (e) {
    console.error('extension/ai-step error', e)
    return corsJson(request, { answers: [] })
  }
}
