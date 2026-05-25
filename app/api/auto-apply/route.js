import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function PUT(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Build a $set object with dot-notation so we never wipe unrelated jobPreferences fields
  const $set = {}

  const profileFields = ['fullName', 'phone', 'location', 'linkedin', 'github', 'portfolio']
  const educationFields = ['university', 'degree', 'graduationYear']
  const skillsFields = ['languages', 'tools', 'technical']
  const jpFields = [
    'yearsExp', 'expectedSalary', 'workAuth', 'sponsorship', 'noticePeriod',
    'keywords', 'searchLocation', 'workType', 'linkedinExpLevel',
  ]

  for (const f of profileFields)   if (body[f] != null) $set[`profile.${f}`]        = body[f]
  for (const f of educationFields) if (body[f] != null) $set[`education.${f}`]       = body[f]
  for (const f of skillsFields)    if (body[f] != null) $set[`skills.${f}`]          = body[f]
  for (const f of jpFields)        if (body[f] != null) $set[`jobPreferences.${f}`]  = body[f]
  if (body.educationField != null) $set['educationField'] = body.educationField
  if (body.captchaApiKey  != null) $set['captchaApiKey']  = body.captchaApiKey

  await connectDB()
  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(session.userId) },
    { $set }
  )

  return Response.json({ success: true })
}
