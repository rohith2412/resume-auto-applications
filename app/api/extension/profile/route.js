import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS(request) { return corsOk(request) }

export async function GET(request) {
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson(request, { error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { email: 1, profile: 1, education: 1, educationField: 1, skills: 1, jobPreferences: 1 } }
  )
  if (!user) return corsJson(request, { error: 'Invalid API key' }, { status: 401 })

  const p  = user.profile        || {}
  const ed = user.education      || {}
  const sk = user.skills         || {}
  const jp = user.jobPreferences || {}

  return corsJson(request, {
    captchaApiKey: user.captchaApiKey || null,
    profile: {
      fullName:    p.fullName,
      phone:       p.phone,
      location:    p.location,
      email:       user.email,
      linkedin:    p.linkedin,
      github:      p.github,
      website:     p.portfolio,
      yearsExp:    jp.yearsExp,
      salary:      jp.expectedSalary,
      workAuth:    jp.workAuth    || 'Yes',
      sponsorship: jp.sponsorship || 'No',
      notice:      jp.noticePeriod,
    },
    education: {
      degree:         ed.degree,
      university:     ed.university,
      field:          user.educationField || '',
      graduationYear: ed.graduationYear,
    },
    skills: {
      languages:  sk.languages,
      tools:      sk.tools,
      technical:  sk.technical,
    },
    jobPreferences: {
      keywords:       jp.keywords,
      searchLocation: jp.searchLocation,
      workType:       jp.workType,
      expLevel:       jp.linkedinExpLevel,
      salary:         jp.expectedSalary,
    },
  })
}
