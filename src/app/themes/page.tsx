'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ThemesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to topics page
    router.push('/topics')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">跳转中...</div>
    </div>
  )
}



























