import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { field, experience, location } = await request.json()
    if (!field || !experience || !location) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    await connectDB()

    await User.findByIdAndUpdate(session.userId, {
      'profile.location': location,
      'jobPreferences.targetRole': field,
      'jobPreferences.yearsExp': String(experience),
      onboardingComplete: true,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[onboarding]', err?.message ?? err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
