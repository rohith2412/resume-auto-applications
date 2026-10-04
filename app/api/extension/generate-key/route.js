import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { randomUUID } from 'crypto'
import { corsJson, corsOk } from '@/lib/extensionCors'

export async function OPTIONS(request) { return corsOk(request) }

export async function GET(request) {
  const session = await getSession()
  if (!session) return corsJson(request, { error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await mongoose.connection.collection('users')
    .findOne(
      { _id: new mongoose.Types.ObjectId(session.userId) },
      { projection: { apiKey: 1 } }
    )
  return corsJson(request, { apiKey: user?.apiKey || null })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return corsJson(request, { error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const apiKey = randomUUID().replace(/-/g, '')

  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(session.userId) },
    { $set: { apiKey } }
  )

  return corsJson(request, { apiKey })
}
