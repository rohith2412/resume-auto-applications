'use client'

import { useUser } from '@/app/components/UserContext'
import AutoApplyClient from '@/app/auto-apply/AutoApplyClient'

export default function AutoApplyPage() {
  const user = useUser()
  if (!user) return null
  return <AutoApplyClient user={user} />
}
