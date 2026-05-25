import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { redirect } from 'next/navigation'
import TailorPage from '../components/TailorPage'

export const metadata = {
  title: 'reblet',
}

export default async function MyResumesPage() {
  const session = await getSession()

  if (!session) redirect('/')

  await connectDB()
  const user = await User.findById(session.userId).select('-password')

  if (!user) redirect('/api/auth/logout')
  if (!user.subscriptionActive && process.env.NODE_ENV === 'production') redirect('/paywall')

  return <TailorPage user={JSON.parse(JSON.stringify(user))} />
}
