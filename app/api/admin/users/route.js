import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Application from '@/models/Application'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rohithra75@gmail.com'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const me = await User.findById(session.userId).select('email')
    if (!me || me.email !== ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await User.find({})
      .select('-password -resumeText -history -apiKey -captchaApiKey')
      .sort({ createdAt: -1 })
      .lean()

    // get application counts per user in one query
    const appCounts = await Application.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 }, statuses: { $push: '$status' } } }
    ])
    const appMap = {}
    appCounts.forEach(a => {
      const statusBreakdown = { applied: 0, interview: 0, offer: 0, rejected: 0 }
      a.statuses.forEach(s => { if (statusBreakdown[s] !== undefined) statusBreakdown[s]++ })
      appMap[a._id.toString()] = { total: a.count, ...statusBreakdown }
    })

    const enriched = users.map(u => ({
      ...u,
      _id: u._id.toString(),
      applications: appMap[u._id.toString()] || { total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
    }))

    const stats = {
      totalUsers:      users.length,
      activeSubscribers: users.filter(u => u.subscriptionActive).length,
      totalApplications: appCounts.reduce((s, a) => s + a.count, 0),
      monthlyRevenue:    users.filter(u => u.subscriptionActive).length * 20,
    }

    return Response.json({ users: enriched, stats })
  } catch (err) {
    console.error('[admin/users]', err?.message ?? err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
