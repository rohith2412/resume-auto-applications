import OpenAI from 'openai'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { corsJson, corsOk } from '@/lib/extensionCors'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function OPTIONS() { return corsOk() }

export async function POST(request) {
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  // Use raw collection to bypass Mongoose strict-mode schema caching
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { profile: 1, education: 1, skills: 1, resumeText: 1 } }
  )
  if (!user) return corsJson({ error: 'Invalid API key' }, { status: 401 })

  const { jobTitle, company, jobDescription, questions = [] } = await request.json()
  if (!questions.length) return corsJson({ answers: [] })

  const p  = user.profile   || {}
  const ed = user.education || {}
  const sk = user.skills    || {}
  const profileSnap = [
    p.fullName    && `Name: ${p.fullName}`,
    p.location    && `Location: ${p.location}`,
    ed.university && `Education: ${ed.degree || ''} at ${ed.university}${ed.graduationYear ? `, ${ed.graduationYear}` : ''}`,
    sk.languages  && `Skills: ${sk.languages}`,
    sk.tools      && `Tools: ${sk.tools}`,
    sk.technical  && `Domain: ${sk.technical}`,
    user.resumeText && `\nResume excerpt:\n${user.resumeText.slice(0, 1200)}`,
  ].filter(Boolean).join('\n')

  const questionBlock = questions.map((q, i) =>
    `${i + 1}. [${q.type || 'text'}] ${q.label}${q.options?.length ? '\n   Options: ' + q.options.join(', ') : ''}`
  ).join('\n')

  const prompt = `You are helping a job applicant auto-fill a LinkedIn Easy Apply form.

Job: ${jobTitle} at ${company}
${jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 800)}` : ''}

Applicant profile:
${profileSnap}

Screening questions:
${questionBlock}

Return ONLY a JSON array, one object per question:
[{"label": "<exact label>", "answer": "<concise answer>"}]

Rules:
- For yes/no or radio: pick the best matching option text exactly
- For years-of-experience: use a realistic number as a string
- For salary: use a number (e.g. "120000")
- Keep text answers under 2 sentences
- No markdown, no explanation — only the JSON array`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.2,
    })
    const raw = completion.choices[0].message.content?.trim() || '[]'
    const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] || '[]'
    const answers = JSON.parse(jsonStr)
    return corsJson({ answers })
  } catch (e) {
    console.error('extension/tailor error', e)
    return corsJson({ answers: [] })
  }
}
