import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Resume from '@/models/Resume'

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { id } = await params
  await connectDB()

  const resume = await Resume.findOne({ _id: id, userId: session.userId })
  if (!resume) return Response.json({ error: 'Not found' }, { status: 404 })

  const { jobDescription, companyName, hiringManager } = await request.json()
  if (!jobDescription?.trim()) return Response.json({ error: 'Job description required' }, { status: 400 })

  const p = resume.personalInfo || {}
  const s = resume.skills || {}
  const recentExp = (resume.experience || []).slice(0, 2)
    .map(e => `${e.title} at ${e.company}${e.bullets?.length ? ': ' + e.bullets.slice(0, 2).join('; ') : ''}`)
    .join('\n')

  const prompt = `Write a professional, personalized cover letter for the following candidate.

CANDIDATE: ${p.fullName || 'Candidate'}
TARGET COMPANY: ${companyName || 'the company'}
HIRING MANAGER: ${hiringManager || 'Hiring Manager'}

CANDIDATE SUMMARY:
${resume.summary || '(no summary provided)'}

RECENT EXPERIENCE:
${recentExp || '(no experience provided)'}

KEY SKILLS:
${[s.technical, s.tools, s.languages].filter(Boolean).join(', ') || '(no skills listed)'}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Open with a specific, engaging hook that references the company or role (NOT "I am writing to apply")
2. In 1-2 paragraphs, connect 2-3 of the candidate's specific achievements or skills to the job's key requirements
3. In one paragraph, express genuine interest in the company/role — be specific to what the job description mentions
4. Close with confidence and a clear call to action
5. Length: 3-4 paragraphs, professional but personable tone
6. Address to "${hiringManager || 'Hiring Manager'}"

Output ONLY the cover letter body. Start with "Dear ${hiringManager || 'Hiring Manager'},"`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 700,
  })

  const coverLetter = completion.choices[0].message.content.trim()
  await Resume.findByIdAndUpdate(id, { coverLetter })

  return Response.json({ coverLetter })
}
