'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import {
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BookOpenIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import {
  BellIcon as BellIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  HomeIcon as HomeIconSolid,
} from '@heroicons/react/24/solid'

interface AppLayoutProps {
  children: React.ReactNode
  profileData?: {
    user: {
      id: string
      username: string
      avatar_url?: string | null
    }
  } | null
}

export default function AppLayout({ children, profileData }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // 页面背景色
  const pageBackgroundColor = '#FAF5F0'

  // 根据路径设置活动菜单
  useEffect(() => {
    if (pathname === '/home') {
      setActiveMenu('home')
    } else if (pathname === '/messages') {
      setActiveMenu('messages')
    } else if (pathname === '/topics') {
      setActiveMenu('community')
    } else if (pathname === '/board') {
      setActiveMenu('articles')
    } else if (pathname?.startsWith('/profile')) {
      setActiveMenu('settings')
    } else {
      setActiveMenu(null)
    }
  }, [pathname])

  // 获取未读消息数
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
        if (!token) return

        const response = await fetch('/api/mentions/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUnreadCount(data.data.count || 0)
          }
        }
      } catch (err) {
        console.error('获取未读通知失败:', err)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    
    window.addEventListener('mentions-updated', fetchUnreadCount)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('mentions-updated', fetchUnreadCount)
    }
  }, [user?.id])

  // 搜索处理
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchQuery.trim())}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      const data = await response.json()
      if (response.ok && data.success && data.data?.id) {
        router.push(`/users/${data.data.id}`)
      } else {
        alert(data.error || '未找到该用户')
      }
    } catch (err) {
      console.error('搜索用户错误:', err)
      alert('搜索失败，请稍后重试')
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: pageBackgroundColor }}>
      {/* Left Sidebar */}
      <div 
        className="flex flex-col items-center py-6"
        style={{
          width: '80px',
          backgroundColor: pageBackgroundColor,
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className="flex items-center justify-center"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: '#000000' }}
            >
              <path
                d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Menu Items */}
        <div
          className="flex flex-col items-center"
          style={{
            width: '56px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            padding: '8px 0',
            gap: '12px',
            marginTop: '48px',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: '56px',
              height: '56px',
              marginTop: '-28px',
              marginBottom: '-12px',
            }}
          >
            {/* 黑色小圆背景 */}
            <div
              style={{
                position: 'absolute',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#000000',
                zIndex: 0,
              }}
            />
            {/* 主页图标按钮 */}
            <button
              onClick={() => {
                setActiveMenu('home')
                router.push('/home')
              }}
              className="relative flex items-center justify-center transition-all duration-200"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                zIndex: 1,
              }}
              title="主页"
            >
              {activeMenu === 'home' ? (
                <HomeIconSolid className="w-6 h-6" style={{ color: '#FFD700' }} />
              ) : (
                <HomeIcon className="w-6 h-6" style={{ color: '#FFD700' }} />
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setActiveMenu('messages')
              router.push('/messages')
            }}
            className="relative flex items-center justify-center transition-all duration-200"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="消息通知"
          >
            {activeMenu === 'messages' ? (
              <BellIconSolid className="w-6 h-6" style={{ color: '#F59E0B' }} />
            ) : (
              <BellIcon className="w-6 h-6" style={{ color: '#6B7280' }} />
            )}
            {unreadCount > 0 && (
              <span 
                className="absolute flex items-center justify-center text-white text-xs font-medium"
                style={{
                  top: '-2px',
                  right: '-2px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#EF4444',
                  borderRadius: '50%',
                  fontSize: '10px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveMenu('community')
              router.push('/topics')
            }}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="社区"
          >
            {activeMenu === 'community' ? (
              <UserGroupIconSolid className="w-6 h-6" style={{ color: '#F59E0B' }} />
            ) : (
              <UserGroupIcon className="w-6 h-6" style={{ color: '#6B7280' }} />
            )}
          </button>

          <button
            onClick={() => {
              setActiveMenu('articles')
              router.push('/board')
            }}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="阅读"
          >
            {activeMenu === 'articles' ? (
              <BookOpenIconSolid className="w-6 h-6" style={{ color: '#F59E0B' }} />
            ) : (
              <BookOpenIcon className="w-6 h-6" style={{ color: '#6B7280' }} />
            )}
          </button>

          <button
            onClick={() => {
              setActiveMenu('settings')
              router.push('/profile')
            }}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="设置"
          >
            {activeMenu === 'settings' ? (
              <Cog6ToothIconSolid className="w-6 h-6" style={{ color: '#F59E0B' }} />
            ) : (
              <Cog6ToothIcon className="w-6 h-6" style={{ color: '#6B7280' }} />
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout and Avatar Container */}
        <div
          className="flex flex-col items-center justify-center mb-4"
          style={{
            width: '56px',
            minHeight: '80px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            padding: '8px 0',
            gap: '8px',
          }}
        >
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: '100%',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="退出登录"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>

          {/* User Avatar */}
          <div 
            className="overflow-hidden"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px solid #D1D5DB',
            }}
          >
            {profileData?.user.id ? (
              <AvatarWithFrame
                userId={profileData.user.id}
                size="sm"
              />
            ) : user?.id ? (
              <AvatarWithFrame
                userId={user.id}
                size="sm"
              />
            ) : (
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#E5E7EB',
                }}
              >
                <span style={{ color: '#6B7280', fontSize: '14px' }}>
                  {user?.username?.[0] || 'U'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: pageBackgroundColor }}>
        {/* Top Navigation Bar */}
        <div 
          className="flex items-center justify-between px-8"
          style={{
            height: '80px',
            backgroundColor: pageBackgroundColor,
          }}
        >
          {/* Left: Greeting */}
          <div>
            <h1 className="text-lg font-semibold" style={{ color: '#111827' }}>
              Hi, {profileData?.user.username || user?.username || 'User'}!
            </h1>
            <p 
              className="text-sm"
              style={{ 
                color: '#6B7280',
                opacity: 0.7,
                marginTop: '8px',
                fontWeight: '400',
              }}
            >
              The soul is blown away like the wind
            </p>
          </div>

          {/* Right: Search Bar with Empty Button */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <form onSubmit={handleSearch} style={{ width: '320px' }}>
              <div className="relative">
                <MagnifyingGlassIcon 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ width: '20px', height: '20px', color: '#9CA3AF' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索用户ID或用户名"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: '#D1D5DB',
                    backgroundColor: '#FFFFFF',
                    fontSize: '14px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </form>
            {/* Empty Button */}
            <button
              type="button"
              className="flex items-center justify-center transition-colors"
              style={{
                width: '80px',
                height: '40px',
                borderRadius: '20px',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              empty
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div 
          className="flex-1 overflow-y-auto page-transition" 
          style={{ 
            backgroundColor: pageBackgroundColor,
            minHeight: 'calc(100vh - 80px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

