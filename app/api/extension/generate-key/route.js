import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { randomUUID } from 'crypto'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS() { return corsOk() }

// GET — return the current key (so dashboard shows it on reload)
export async function GET() {
  const session = await getSession()
  if (!session) return corsJson({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users')
    .findOne(
      { _id: new mongoose.Types.ObjectId(session.userId) },
      { projection: { apiKey: 1 } }
    )
  return corsJson({ apiKey: user?.apiKey || null })
}

// POST — generate a fresh key and write it directly to MongoDB
export async function POST() {
  const session = await getSession()
  if (!session) return corsJson({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const apiKey = randomUUID().replace(/-/g, '')

  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(session.userId) },
    { $set: { apiKey } }
  )

  return corsJson({ apiKey })
}
