import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BlurredPreview from './components/BlurredPreview'

export default async function Home() {
  const session = await getSession()
  if (session) redirect('/applications')
  return <BlurredPreview />
}
