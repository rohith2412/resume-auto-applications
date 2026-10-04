import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import Application from '@/models/Application'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS(request) { return corsOk(request) }

export async function POST(request) {
  const apiKey = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!apiKey) return corsJson(request, { error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users').findOne(
    { apiKey },
    { projection: { _id: 1 } }
  )
  if (!user) return corsJson(request, { error: 'Invalid API key' }, { status: 401 })

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

  return corsJson(request, { ok: true, applicationId: app._id })
}
