import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Resume from '@/models/Resume'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  const resume = await Resume.findOne({ _id: id, userId: session.userId })
  if (!resume) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ resume })
}

export async function PUT(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  const body = await request.json()
  const allowed = ['title', 'jobTitle', 'company', 'jobDescription', 'resumeText', 'tailoredVersion']
  const updates = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const resume = await Resume.findOneAndUpdate(
    { _id: id, userId: session.userId },
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!resume) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ resume })
}

export async function DELETE(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  await Resume.deleteOne({ _id: id, userId: session.userId })

  return Response.json({ success: true })
}
