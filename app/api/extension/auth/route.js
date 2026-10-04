import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS(request) { return corsOk(request) }

export async function POST(request) {
  try {
    const { apiKey } = await request.json()
    if (!apiKey) return corsJson(request, { error: 'No API key' }, { status: 401 })

    await connectDB()
    const user = await mongoose.connection.collection('users').findOne(
      { apiKey },
      { projection: { email: 1, profile: 1 } }
    )
    if (!user) return corsJson(request, { error: 'Invalid API key' }, { status: 401 })

    return corsJson(request, {
      ok: true,
      user: { email: user.email, fullName: user.profile?.fullName || '' },
    })
  } catch {
    return corsJson(request, { error: 'Server error' }, { status: 500 })
  }
}
