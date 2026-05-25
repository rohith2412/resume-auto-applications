import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Resume from '@/models/Resume'

function buildResumeText(resume) {
  const parts = []
  const p = resume.personalInfo || {}

  if (p.fullName) parts.push(p.fullName)
  const contact = [p.email, p.phone, p.location, p.linkedin].filter(Boolean)
  if (contact.length) parts.push(contact.join(' | '))

  if (resume.summary) parts.push('\nSUMMARY\n' + resume.summary)

  if (resume.experience?.length > 0) {
    parts.push('\nEXPERIENCE')
    resume.experience.forEach(exp => {
      const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')
      parts.push(`${exp.title} | ${exp.company} | ${dates}`)
      exp.bullets?.forEach(b => b.trim() && parts.push(`• ${b}`))
    })
  }

  if (resume.education?.length > 0) {
    parts.push('\nEDUCATION')
    resume.education.forEach(edu => {
      parts.push(`${edu.degree} | ${edu.institution} | ${edu.graduationYear}`)
    })
  }

  const s = resume.skills || {}
  const skillText = [s.technical, s.tools, s.languages, s.soft].filter(Boolean).join(', ')
  if (skillText) parts.push('\nSKILLS\n' + skillText)

  if (resume.projects?.length > 0) {
    parts.push('\nPROJECTS')
    resume.projects.forEach(proj => {
      parts.push(`${proj.name} | ${proj.technologies || ''}`)
      proj.bullets?.forEach(b => b.trim() && parts.push(`• ${b}`))
    })
  }

  return parts.join('\n')
}

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { id } = await params
  await connectDB()

  const resume = await Resume.findOne({ _id: id, userId: session.userId })
  if (!resume) return Response.json({ error: 'Not found' }, { status: 404 })

  const resumeText = buildResumeText(resume)

  const prompt = `Analyze this resume and return a JSON score. Be honest and specific.

RESUME:
${resumeText}

Return ONLY valid JSON in this exact format:
{
  "overall": <0-100>,
  "ats": <0-100>,
  "impact": <0-100>,
  "completeness": <0-100>,
  "keywords": <0-100>,
  "feedback": ["specific actionable tip 1", "specific actionable tip 2", "specific actionable tip 3"]
}

Scoring criteria:
- ats: ATS compatibility — standard section names, clean formatting, no graphics/tables
- impact: Achievement strength — action verbs, quantified results, accomplishments not just duties
- completeness: All important sections present with sufficient detail
- keywords: Industry-relevant keywords and skills present
- feedback: 3 specific, actionable improvement tips (reference actual content from the resume)`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  })

  const scoreData = JSON.parse(completion.choices[0].message.content)

  await Resume.findByIdAndUpdate(id, {
    score: scoreData.overall,
    scoreBreakdown: {
      ats:          scoreData.ats,
      impact:       scoreData.impact,
      completeness: scoreData.completeness,
      keywords:     scoreData.keywords,
    },
    scoreFeedback: scoreData.feedback || [],
  })

  return Response.json(scoreData)
}
