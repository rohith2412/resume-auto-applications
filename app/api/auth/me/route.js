import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ user: null }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.userId).select('-password -googleAccessToken -googleRefreshToken')
  if (!user) {
    return Response.json({ user: null }, { status: 401 })
  }

  const obj = user.toObject()
  obj.hasGmailAppPassword = !!obj.gmailAppPassword
  delete obj.gmailAppPassword

  return Response.json({ user: obj })
}
