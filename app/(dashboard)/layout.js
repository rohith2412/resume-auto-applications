import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { redirect } from 'next/navigation'

export const metadata = { title: 'reblet' }

export default async function DashboardLayout({ children }) {
  const session = await getSession()
  if (!session) redirect('/')

  await connectDB()
  const user = await User.findById(session.userId).select('-password')
  if (!user) redirect('/api/auth/logout')
  // Paywall gate disabled for now
  // if (!user.subscriptionActive && process.env.NODE_ENV === 'production') redirect('/paywall')
  if (!user.onboardingComplete) redirect('/onboarding')

  return <>{children}</>
}
