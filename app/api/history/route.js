import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findById(session.userId).select('history')
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 })

  const history = [...(user.history || [])].reverse()
  return Response.json({ history })
}
