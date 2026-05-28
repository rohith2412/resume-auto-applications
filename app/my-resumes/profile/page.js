'use client'

import { useUser } from '@/app/components/UserContext'
import { useToast } from '@/app/components/Toast'
import ProfileView from '@/app/components/ProfileView'

export default function ProfilePage() {
  const user = useUser()
  const toast = useToast()
  if (!user) return null
  return <ProfileView user={user} toast={toast} />
}
