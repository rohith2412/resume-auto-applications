import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.userId)

  if (!user?.subscriptionActive && process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Subscription required' }, { status: 403 })
  }

  if (!user.resumeText) {
    return Response.json({ error: 'No resume found. Please upload a resume first.' }, { status: 400 })
  }

  const { jobDescription } = await request.json()
  if (!jobDescription?.trim()) {
    return Response.json({ error: 'Job description is required' }, { status: 400 })
  }

  const p = user.profile || {}
  const edu = user.education || {}
  const skills = user.skills || {}
  const prefs = user.jobPreferences || {}

  const prompt = `You are an expert resume writer. Your job is to tailor a resume for ANY industry and job type — not just tech. Adapt your language, section emphasis, and keywords to match the specific field and role in the job description.

CANDIDATE PROFILE:
- Name: ${p.fullName || 'Candidate'}
- Phone: ${p.phone || ''}
- Location: ${p.location || ''}
- LinkedIn: ${p.linkedin || ''}
- Website / Portfolio: ${p.portfolio || ''}
- GitHub: ${p.github || ''}
- Professional Summary: ${p.summary || ''}

EDUCATION:
- Institution: ${edu.university || ''}
- Degree / Certification: ${edu.degree || ''}
- GPA: ${edu.gpa || ''}
- Graduation / Completion: ${edu.graduationYear || ''}
- Relevant Coursework / Training: ${edu.relevantCourses || ''}

SKILLS & EXPERTISE:
- Specialized Skills: ${skills.languages || ''}
- Tools & Software: ${skills.tools || ''}
- Domain Knowledge: ${skills.technical || ''}
- Soft Skills: ${skills.soft || ''}

JOB PREFERENCES:
- Target Role: ${prefs.targetRole || ''}
- Experience Level: ${prefs.experienceLevel || ''}
- Available From: ${prefs.availableFrom || ''}

ORIGINAL RESUME:
${user.resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK:
Rewrite the resume to maximize alignment with the job description. Rules:
1. Never invent experience, credentials, or skills not in the original resume
2. Mirror the job description's exact keywords and industry-specific language in bullet points
3. Lead each bullet with a strong action verb and quantify impact wherever possible
4. Prioritize and reorder experiences most relevant to this specific role
5. Adapt section names to fit the industry — e.g. use "Clinical Experience" for healthcare, "Case Experience" for consulting, "Teaching Experience" for education, "Technical Projects" for engineering, etc.
6. Output clean plain text, properly sectioned with clear section headers in ALL CAPS
7. Sections to include (adapt as needed): Contact Info, Professional Summary, Experience, [Industry-relevant section if applicable], Education, Skills
8. Summary: 2-3 sentences specifically tailored to this job and industry
9. Keep total length to one page worth of content
10. If the role is non-technical, do not include GitHub or programming-focused content unless it appears in the original resume and is genuinely relevant

Output ONLY the resume text. No commentary, no markdown.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const tailoredResume = completion.choices[0].message.content

  // Extract a job title from the first line of the job description
  const jobTitle = jobDescription.split('\n').find(l => l.trim().length > 3)?.trim().slice(0, 80) || 'Tailored Resume'

  await User.findByIdAndUpdate(session.userId, {
    $push: {
      history: {
        $each: [{ jobTitle, resumeText: tailoredResume, jobDescription }],
        $slice: -50,
      },
    },
  })

  return Response.json({ resume: tailoredResume })
}
