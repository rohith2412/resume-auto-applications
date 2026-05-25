import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Resume from '@/models/Resume'
import User from '@/models/User'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const resumes = await Resume.find({ userId: session.userId })
    .select('name template score scoreBreakdown updatedAt personalInfo createdAt')
    .sort({ updatedAt: -1 })

  return Response.json({ resumes })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await request.json().catch(() => ({}))

  let personalInfo = body.personalInfo || {}
  let education = body.education || []
  let skills = body.skills || {}

  if (body.prefillFromProfile) {
    const user = await User.findById(session.userId).select('profile education skills')
    if (user) {
      const p = user.profile || {}
      const edu = user.education || {}
      const sk = user.skills || {}
      personalInfo = {
        fullName: p.fullName || '',
        email: '',
        phone: p.phone || '',
        location: p.location || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        portfolio: p.portfolio || '',
      }
      if (edu.institution) {
        education = [{
          institution: edu.institution || '',
          degree: edu.degree || '',
          gpa: edu.gpa || '',
          graduationYear: edu.graduationYear || '',
          courses: edu.relevantCourses || '',
        }]
      }
      skills = {
        technical: sk.technical || '',
        tools: sk.tools || '',
        languages: sk.languages || '',
        soft: sk.soft || '',
      }
    }
  }

  const resume = await Resume.create({
    userId: session.userId,
    name: body.name || 'Untitled Resume',
    template: body.template || 'classic',
    personalInfo,
    education,
    skills,
  })

  return Response.json({ resume }, { status: 201 })
}
