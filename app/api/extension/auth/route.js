import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS() { return corsOk() }

export async function POST(request) {
  try {
    const { apiKey } = await request.json()
    if (!apiKey) return corsJson({ error: 'No API key' }, { status: 401 })

    await connectDB()
    // Use raw collection to bypass Mongoose strict-mode schema caching
    const user = await mongoose.connection.collection('users').findOne(
      { apiKey },
      { projection: { email: 1, profile: 1 } }
    )
    if (!user) return corsJson({ error: 'Invalid API key' }, { status: 401 })

    return corsJson({
      ok: true,
      user: { email: user.email, fullName: user.profile?.fullName || '' },
    })
  } catch {
    return corsJson({ error: 'Server error' }, { status: 500 })
  }
}
