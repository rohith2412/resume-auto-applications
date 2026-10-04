import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function PUT(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    // Personal
    fullName, phone, location, linkedin, github, portfolio, summary,
    // Education
    university, degree, gpa, graduationYear, relevantCourses, educationField,
    // Skills
    technical, languages, tools, soft,
    // Job preferences (original)
    targetRole, experienceLevel, preferredLocation, remote,
    openToRelocation, targetCompanies, availableFrom, expectedSalary,
    // Extension / Auto-Apply specific
    yearsExp, workAuth, sponsorship, noticePeriod,
    keywords, searchLocation, workType, linkedinExpLevel,
  } = body

  await connectDB()
  await User.findByIdAndUpdate(session.userId, {
    profile: { fullName, phone, location, linkedin, github, portfolio, summary },
    education: { university, degree, gpa, graduationYear, relevantCourses },
    educationField,
    skills: { technical, languages, tools, soft },
    jobPreferences: {
      targetRole, experienceLevel, preferredLocation, remote,
      openToRelocation, targetCompanies, availableFrom, expectedSalary,
      yearsExp, workAuth, sponsorship, noticePeriod,
      keywords, searchLocation, workType, linkedinExpLevel,
    },
  })

  return Response.json({ success: true })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates = {}

  if (body.fullName !== undefined) updates['profile.fullName'] = body.fullName
  if (body.location !== undefined) updates['profile.location'] = body.location
  if (body.linkedin !== undefined) updates['profile.linkedin'] = body.linkedin
  if (body.keywords !== undefined) updates['jobPreferences.keywords'] = body.keywords
  if (body.searchLocation !== undefined) updates['jobPreferences.searchLocation'] = body.searchLocation
  if (body.targetRole !== undefined) updates['jobPreferences.targetRole'] = body.targetRole

  if (Object.keys(updates).length === 0) return Response.json({ success: true })

  await connectDB()
  const { default: mongoose } = await import('mongoose')
  await mongoose.connection.db.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(session.userId) },
    { $set: updates }
  )
  return Response.json({ success: true })
}
