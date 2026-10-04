import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findById(session.userId).select('coldEmails')
  const emails = (user?.coldEmails || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return Response.json({ emails })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await request.json()
  if (!id || !status) return Response.json({ error: 'Missing id or status' }, { status: 400 })

  await connectDB()
  await User.updateOne(
    { _id: session.userId, 'coldEmails._id': id },
    { $set: { 'coldEmails.$.status': status, ...(status === 'sent' ? { 'coldEmails.$.sentAt': new Date() } : {}) } }
  )

  return Response.json({ success: true })
}
