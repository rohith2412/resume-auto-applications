'use client'

import dynamic from 'next/dynamic'
import { useToast } from '@/app/components/Toast'

// ssr:false so window.innerWidth is always available from first render
const ApplicationsView = dynamic(() => import('@/app/components/ApplicationsView'), { ssr: false })

export default function ApplicationsPage() {
  const toast = useToast()
  return <ApplicationsView toast={toast} />
}
