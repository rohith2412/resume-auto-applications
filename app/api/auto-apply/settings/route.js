import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findById(session.userId).select('jobPreferences')
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 })

  const jp = user.jobPreferences || {}
  return Response.json({
    keywords:         jp.keywords         || '',
    searchLocation:   jp.searchLocation   || '',
    workType:         jp.workType         || '',
    linkedinExpLevel: jp.linkedinExpLevel || '',
  })
}
