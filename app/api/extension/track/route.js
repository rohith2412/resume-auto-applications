import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import Application from '@/models/Application'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS() { return corsOk() }

export async function POST(request) {
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  // Use raw collection to bypass Mongoose strict-mode schema caching
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { _id: 1 } }
  )
  if (!user) return corsJson({ error: 'Invalid API key' }, { status: 401 })

  const { jobTitle, company, jobUrl, jobDescription, status } = await request.json()

  const app = await Application.create({
    userId: user._id,
    jobTitle: jobTitle || '',
    company: company || '',
    jobUrl: jobUrl || '',
    jobDescription: jobDescription || '',
    status: status || 'applied',
    appliedAt: new Date(),
  })

  return corsJson({ ok: true, applicationId: app._id })
}
