'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import AppLayout from './AppLayout'
import { getAuthHeaders } from '@/lib/auth/client'

interface ProfileData {
  user: {
    id: string
    username: string
    avatar_url?: string | null
  }
}

export default function ConditionalAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  // 获取用户资料数据用于头像显示
  useEffect(() => {
    // 在登录页面不需要加载用户资料
    if (pathname === '/') {
      return
    }

    if (user?.id) {
      const loadProfile = async () => {
        try {
          const response = await fetch('/api/user/profile/preview', {
            headers: getAuthHeaders(),
            credentials: 'include',
            cache: 'no-store',
          })

          const data = await response.json()
          if (response.ok && data.success) {
            setProfileData(data.data)
          }
        } catch (err) {
          console.error('获取用户资料错误:', err)
        }
      }

      loadProfile()
    }
  }, [user?.id, pathname])

  // 在登录页面不显示布局
  if (pathname === '/') {
    return <>{children}</>
  }

  // 其他页面使用布局
  return (
    <AppLayout profileData={profileData}>
      {children}
    </AppLayout>
  )
}

