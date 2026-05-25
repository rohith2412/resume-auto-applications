import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'

// GET → list all applications
export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const apps = await Application.find({ userId: session.userId })
    .sort({ appliedAt: -1 })
    .select('-jobDescription')  // keep response light
  return Response.json({ applications: apps })
}

// PATCH { id, status } → update status
export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, notes } = await request.json()
  await connectDB()
  const update = {}
  if (status) update.status = status
  if (notes !== undefined) update.notes = notes

  const app = await Application.findOneAndUpdate(
    { _id: id, userId: session.userId },
    update,
    { new: true }
  )
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ application: app })
}

// DELETE ?id=xxx
export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  await connectDB()
  await Application.findOneAndDelete({ _id: id, userId: session.userId })
  return Response.json({ ok: true })
}
