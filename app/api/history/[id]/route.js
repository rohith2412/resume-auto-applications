import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function DELETE(request, { params }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await connectDB()
  await User.findByIdAndUpdate(session.userId, {
    $pull: { history: { _id: id } },
  })

  return Response.json({ success: true })
}
