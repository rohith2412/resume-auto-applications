import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Resume from '@/models/Resume'
import User from '@/models/User'

function formatResumeForAI(resume) {
  const parts = []
  const p = resume.personalInfo || {}

  const header = [p.fullName, p.phone, p.location, p.email, p.linkedin, p.portfolio, p.github].filter(Boolean)
  parts.push(header.join(' | '))

  if (resume.summary) parts.push('\nSUMMARY:\n' + resume.summary)

  if (resume.experience?.length > 0) {
    parts.push('\nEXPERIENCE:')
    resume.experience.forEach(exp => {
      const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')
      parts.push(`${exp.title} at ${exp.company}${exp.location ? ', ' + exp.location : ''} | ${dates}`)
      exp.bullets?.forEach(b => b.trim() && parts.push(`• ${b}`))
    })
  }

  if (resume.education?.length > 0) {
    parts.push('\nEDUCATION:')
    resume.education.forEach(edu => {
      parts.push(`${edu.degree} — ${edu.institution} | ${edu.graduationYear}`)
      if (edu.gpa) parts.push(`GPA: ${edu.gpa}`)
      if (edu.courses) parts.push(`Courses: ${edu.courses}`)
    })
  }

  const s = resume.skills || {}
  const skillLines = []
  if (s.technical) skillLines.push(`Technical: ${s.technical}`)
  if (s.tools) skillLines.push(`Tools: ${s.tools}`)
  if (s.languages) skillLines.push(`Languages/Frameworks: ${s.languages}`)
  if (s.soft) skillLines.push(`Soft Skills: ${s.soft}`)
  if (skillLines.length) parts.push('\nSKILLS:\n' + skillLines.join('\n'))

  if (resume.projects?.length > 0) {
    parts.push('\nPROJECTS:')
    resume.projects.forEach(proj => {
      parts.push(`${proj.name}${proj.technologies ? ' | ' + proj.technologies : ''}${proj.url ? ' | ' + proj.url : ''}`)
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

  const { jobDescription } = await request.json()
  if (!jobDescription?.trim()) return Response.json({ error: 'Job description required' }, { status: 400 })

  const resumeText = formatResumeForAI(resume)

  const prompt = `You are an expert resume writer. Tailor this resume to maximize alignment with the given job description.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

RULES:
1. Never invent experience, credentials, or skills not in the original resume
2. Mirror the job description's exact keywords, terminology, and language
3. Lead each bullet with a strong action verb; quantify impact wherever possible
4. Reorder/prioritize experiences and skills most relevant to this role
5. Rewrite the summary specifically for this role (2-3 sentences)
6. Output clean plain text with ALL CAPS section headers
7. Standard sections: Contact Info, Professional Summary, Experience, Education, Skills (and Projects if relevant)
8. Keep length to one page worth of content
9. Adapt section names to the industry if needed (e.g., "Clinical Experience" for healthcare)

Output ONLY the tailored resume text. No commentary, no markdown.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const tailoredVersion = completion.choices[0].message.content.trim()

  await Resume.findByIdAndUpdate(id, { tailoredVersion, tailoredJobDescription: jobDescription })

  const jobTitle = jobDescription.split('\n').find(l => l.trim().length > 3)?.trim().slice(0, 80) || 'Tailored Resume'
  await User.findByIdAndUpdate(session.userId, {
    $push: {
      history: {
        $each: [{ jobTitle, resumeText: tailoredVersion, jobDescription }],
        $slice: -50,
      },
    },
  })

  return Response.json({ tailoredVersion })
}
