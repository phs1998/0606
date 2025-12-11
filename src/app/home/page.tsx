'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import {
  GiftIcon,
  PencilSquareIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

interface ProfileData {
  user: {
    id: string
    username: string
    avatar_url?: string | null
    exp: number
    registration_number: number
    equipped_avatar_frame_id?: string | null
    unlocked_name_color_id?: string | null
  }
  profile: {
    bio?: string | null
    background_image_url?: string | null
    custom_fields?: {
      profile_card_color?: string
      [key: string]: any
    }
  } | null
  equipped_avatar_frame: {
    id: string
    name: string
    image_url?: string | null
  } | null
  equipped_name_color: {
    id: string
    name: string
    color_code: string
  } | null
  total_likes_received: number
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading, logout, refreshUser } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasDrawnToday, setHasDrawnToday] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set())
  const [showColorPanel, setShowColorPanel] = useState(false)
  const [profileCardColor, setProfileCardColor] = useState('#FFFBEB')
  const [boredomProgress, setBoredomProgress] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const hasInitializedRef = useRef(false)

  // 保存名片颜色到后端
  const saveProfileCardColor = useCallback(async (color: string) => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
      if (!token) {
        console.error('保存名片颜色失败: 没有 token')
        return
      }

      // 先获取当前的 profile 数据，确保 custom_fields 被正确合并
      let currentCustomFields: Record<string, any> = {}
      try {
        const currentResponse = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })
        if (currentResponse.ok) {
          const currentData = await currentResponse.json()
          if (currentData.success && currentData.data?.profile?.custom_fields) {
            currentCustomFields = currentData.data.profile.custom_fields || {}
          }
        }
      } catch (fetchErr) {
        console.warn('获取当前 profile 失败，使用本地状态:', fetchErr)
        // 如果获取当前数据失败，尝试从本地状态获取
        if (profileData?.profile?.custom_fields) {
          currentCustomFields = profileData.profile.custom_fields || {}
        }
      }

      // 更新 custom_fields，保留其他字段
      const updatedCustomFields = {
        ...currentCustomFields,
        profile_card_color: color,
      }

      console.log('保存名片颜色 - 当前 custom_fields:', currentCustomFields)
      console.log('保存名片颜色 - 更新后 custom_fields:', updatedCustomFields)

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          custom_fields: updatedCustomFields,
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('保存名片颜色成功:', color, '响应数据:', responseData)
        
        // 立即更新颜色状态，确保UI立即响应
        setProfileCardColor(color)
        
        // 更新本地状态
        setProfileData(prev => {
          if (prev && prev.profile) {
            return {
              ...prev,
              profile: {
                ...prev.profile,
                custom_fields: updatedCustomFields,
              },
            }
          } else if (prev) {
            return {
              ...prev,
              profile: {
                ...prev.profile,
                custom_fields: updatedCustomFields,
              },
            }
          }
          // 如果 prev 为 null，保持 null（这种情况不应该发生，因为已经有 profileData）
          return prev
        })
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        console.error('保存名片颜色失败: 响应错误', response.status, errorData)
      }
    } catch (err) {
      console.error('保存名片颜色失败:', err)
    }
  }, [profileData])

  // 加载资料数据
  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/profile/preview', {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setProfileData(data.data)
        // 从 custom_fields 中恢复名片颜色
        const profile = data.data?.profile
        const customFields = profile?.custom_fields
        const savedColor = customFields?.profile_card_color
        
        console.log('加载资料 - profile:', profile)
        console.log('加载资料 - customFields:', customFields)
        console.log('加载资料 - savedColor:', savedColor)
        
        // 始终从服务器读取的颜色优先，只有在没有保存值时才使用默认值
        if (savedColor && typeof savedColor === 'string' && savedColor.trim() !== '') {
          // 确保设置的颜色值被正确应用
          const trimmedColor = savedColor.trim()
          setProfileCardColor(trimmedColor)
          console.log('恢复名片颜色:', trimmedColor)
        } else if (profile === null || !customFields || !customFields.profile_card_color) {
          // 只有在profile为null或者确实没有保存颜色时才使用默认值
          setProfileCardColor('#FFFBEB')
          console.log('使用默认名片颜色: #FFFBEB (没有保存的颜色)')
        }
        // 如果 savedColor 为空字符串或其他无效值，保持当前颜色不变
      } else {
        setError(data.error || '获取资料失败')
      }
    } catch (err) {
      console.error('获取用户资料错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkDrawStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/lottery/status', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setHasDrawnToday(data.data.has_drawn_today)
      }
    } catch (err) {
      console.error('检查抽奖状态错误:', err)
    }
  }, [])

  // 获取已登录日期（通过抽奖记录）
  const fetchLoggedDates = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
      if (!token) return

      const response = await fetch('/api/stories/history?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.draws) {
          const datesSet = new Set<string>()
          data.data.draws.forEach((draw: { draw_date: string }) => {
            if (draw.draw_date) {
              // 提取日期部分（YYYY-MM-DD），忽略时间部分
              const dateOnly = draw.draw_date.split('T')[0].split(' ')[0]
              datesSet.add(dateOnly)
            }
          })
          setLoggedDates(datesSet)
        }
      }
    } catch (err) {
      console.error('获取登录日期失败:', err)
    }
  }, [])

  // 初始化无聊值进度
  const initializeBoredomProgress = useCallback(() => {
    if (typeof window === 'undefined') return
    
    // 从localStorage读取保存的进度值
    const savedProgress = parseInt(localStorage.getItem('boredomProgress') || '0', 10)
    
    // 检查是否是新进入网站（通过sessionStorage标记）
    const hasVisited = sessionStorage.getItem('hasVisited')
    
    if (!hasVisited) {
      // 新进入网站，增加5
      const newProgress = Math.min(savedProgress + 5, 100)
      localStorage.setItem('boredomProgress', newProgress.toString())
      sessionStorage.setItem('hasVisited', 'true')
      setBoredomProgress(newProgress)
    } else {
      // 从其他页面返回，不增加
      setBoredomProgress(savedProgress)
    }
  }, [])

  // 主初始化 useEffect - 只在用户登录状态变化时运行一次
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/')
      hasInitializedRef.current = false
      return
    }

    if (user && !hasInitializedRef.current) {
      // 只在首次加载时执行，避免重复调用
      loadProfile()
      checkDrawStatus()
      fetchLoggedDates()
      initializeBoredomProgress()
      hasInitializedRef.current = true
    }
    // 移除函数依赖，避免循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  // 监听 user.avatar_url 变化，自动刷新资料
  useEffect(() => {
    if (user && profileData) {
      // 如果 AuthContext 中的 avatar_url 与当前显示的 avatar_url 不同，则刷新
      const userAvatarUrl = user.avatar_url || ''
      const profileAvatarUrl = profileData.user.avatar_url || ''
      if (userAvatarUrl !== profileAvatarUrl) {
        loadProfile()
      }
    }
    // 只依赖 avatar_url 变化，不依赖 profileData，避免循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.avatar_url])

  // 监听页面可见性变化，当页面重新可见时刷新资料
  useEffect(() => {
    if (!user) return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // 只在页面从隐藏变为可见时刷新，避免频繁刷新
        loadProfile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // 移除 loadProfile 依赖，避免循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // 监听 storage 事件，当其他标签页更新头像时刷新
  useEffect(() => {
    if (!user) return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'avatar_updated' && user) {
        loadProfile()
        refreshUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
    // 移除 loadProfile 和 refreshUser 依赖，避免循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // 获取已登录日期（当月份变化时重新获取）
  useEffect(() => {
    if (user) {
      fetchLoggedDates()
    }
  }, [currentMonth, user, fetchLoggedDates])

  // 点击页面其他区域关闭提示框
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTooltip(false)
    }
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showTooltip])

  const handleDraw = async () => {
    if (hasDrawnToday || drawing) return

    setDrawing(true)
    try {
      const token = sessionStorage.getItem('token')
      const response = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setHasDrawnToday(true)
        alert(`抽奖结果: ${data.data.is_win ? data.data.reward_name || '中奖了！' : '很遗憾，下次好运！'}`)
      }
    } catch (err) {
      console.error('抽奖错误:', err)
    } finally {
      setDrawing(false)
    }
  }

  // Calendar generation function
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }


  // 主页整体背景色（包括导航栏和菜单栏）
  const pageBackgroundColor = '#FAF5F0'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: pageBackgroundColor }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: pageBackgroundColor }}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#6366F1' }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  const calendarDays = getDaysInMonth(currentMonth)
  const today = new Date()
  
  const isToday = (day: number | null) => {
    if (!day) return false
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  // 判断是否是已登录日期（通过抽奖记录判断）
  const isLoggedDate = (day: number | null) => {
    if (!day) return false
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return loggedDates.has(dateStr)
  }

  // 判断是否是节假日
  const isHoliday = (day: number | null) => {
    if (!day) return false
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    
    // 周末也算节假日
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true
    }
    
    // 可以添加更多节假日判断，比如：
    // 元旦、春节、清明节、劳动节、端午节、中秋节、国庆节等
    
    return false
  }

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // 统一的卡片样式
  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }

  return (
    <div style={{ padding: '24px', paddingLeft: '32px', paddingRight: '32px' }}>
      <div className="grid grid-cols-12 gap-6" style={{ width: '100%', maxWidth: 'none' }}>
            {/* Left Column - 个人名片、文章（从上到下排列） */}
            <div className="col-span-12 lg:col-span-8 flex flex-col justify-between" style={{ minHeight: 'calc(100vh - 160px)' }}>
              {/* 1. Profile Card - 个人名片（增大） */}
              <div style={{ ...cardStyle, backgroundColor: profileCardColor, position: 'relative' }}>
                {/* 转换符号按钮 - 右上角 */}
                <button
                  onClick={() => setShowColorPanel(!showColorPanel)}
                  className="absolute top-4 right-4 flex items-center justify-center transition-transform hover:rotate-90"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ color: '#000000' }}
                  >
                    <path
                      d="M21 12C21 16.9706 16.9706 21 12 21M21 12C21 7.02944 16.9706 3 12 3M21 12H3M3 12C3 7.02944 7.02944 3 12 3M3 12C3 16.9706 7.02944 21 12 21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 16L16 12L12 8M8 8L4 12L8 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* 颜色下拉面板 */}
                {showColorPanel && (
                  <div
                    className="absolute top-14 right-4 flex items-center"
                    style={{
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '24px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 20,
                    }}
                  >
                    {/* 珊瑚红 */}
                    <button
                      onClick={() => {
                        setProfileCardColor('#FF7F7F')
                        setShowColorPanel(false)
                      }}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#FF7F7F',
                        border: '2px solid #FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    {/* 白蓝色 */}
                    <button
                      onClick={() => {
                        const color = '#87CEEB'
                        setProfileCardColor(color)
                        saveProfileCardColor(color)
                        setShowColorPanel(false)
                      }}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#87CEEB',
                        border: '2px solid #FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    {/* 四绿色 */}
                    <button
                      onClick={() => {
                        const color = '#4ECDC4'
                        setProfileCardColor(color)
                        saveProfileCardColor(color)
                        setShowColorPanel(false)
                      }}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#4ECDC4',
                        border: '2px solid #FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    {/* 黑色 */}
                    <button
                      onClick={() => {
                        const color = '#000000'
                        setProfileCardColor(color)
                        saveProfileCardColor(color)
                        setShowColorPanel(false)
                      }}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#000000',
                        border: '2px solid #FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    {/* 丁香紫 */}
                    <button
                      onClick={() => {
                        const color = '#DDA0DD'
                        setProfileCardColor(color)
                        saveProfileCardColor(color)
                        setShowColorPanel(false)
                      }}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#DDA0DD',
                        border: '2px solid #FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    {/* 香蕉黄 */}
                    <button
                      onClick={() => {
                        const color = '#FFE135'
                        setProfileCardColor(color)
                        saveProfileCardColor(color)
                        setShowColorPanel(false)
                      }}
                      className="transition-transform hover:scale-110"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#FFE135',
                        border: '2px solid #FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </div>
                )}

                <div 
                  className="relative rounded-xl"
                  style={{
                    height: '400px',
                  }}
                >
                  <div 
                    className="flex items-end"
                    style={{ gap: '24px', padding: '32px' }}
                  >
                    <div 
                      className="overflow-hidden bg-white flex-shrink-0"
                      style={{
                        width: '128px',
                        height: '128px',
                        borderRadius: '50%',
                        border: '4px solid #FFFFFF',
                      }}
                    >
                      {profileData?.user.id ? (
                        <AvatarWithFrame
                          userId={profileData.user.id}
                          size="2xl"
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
                          <span style={{ color: '#6B7280', fontSize: '48px' }}>
                            {profileData?.user.username?.[0] || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <h2 
                        className="font-bold mb-2"
                        style={{ fontSize: '32px', lineHeight: '1.2', color: '#111827' }}
                      >
                        {profileData?.user.username || user.username}
                      </h2>
                      <p 
                        className="mb-2"
                        style={{ fontSize: '18px', lineHeight: '1.4', color: '#374151' }}
                      >
                        {profileData?.profile?.bio || '这个人很懒，什么都没有留下'}
                      </p>
                      <p 
                        style={{ fontSize: '16px', color: '#6B7280' }}
                      >
                        #{profileData?.user.registration_number || user.registration_number}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Boring Value Card - 无聊值组件 */}
              <div 
                style={{ 
                  ...cardStyle, 
                  padding: '16px 20px',
                  width: '33.33%',
                  height: '120px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* 左侧区域：文字 + 问号按钮 */}
                <div className="flex flex-col" style={{ position: 'relative', flex: 1, paddingRight: '16px' }}>
                  {/* 文字区域 */}
                  <div className="flex flex-col mb-2">
                    <h3 
                      className="font-semibold mb-1"
                      style={{ 
                        fontSize: '18px',
                        color: '#333333',
                        opacity: 0.9,
                      }}
                    >
                      Boring value
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ 
                        fontSize: '14px',
                        color: '#666666',
                        opacity: 0.7,
                      }}
                    >
                      Beware of excessive boredom
                    </p>
                  </div>

                  {/* 问号按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowTooltip(!showTooltip)
                    }}
                    className="flex items-center justify-center self-start"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#000000',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      zIndex: 10,
                      marginTop: '4px',
                    }}
                  >
                    ?
                  </button>

                  {/* 提示框 */}
                  {showTooltip && (
                    <div
                      className="absolute"
                      style={{
                        bottom: '32px',
                        left: '0px',
                        backgroundColor: '#333333',
                        color: '#FFFFFF',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        zIndex: 20,
                        whiteSpace: 'nowrap',
                        maxWidth: '250px',
                      }}
                    >
                      你的每一次进出网页，都会导致无聊值增加
                    </div>
                  )}
                </div>

                {/* 右侧区域：进度条 */}
                <div
                  className="relative flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '80px',
                    height: '80px',
                  }}
                >
                  {/* 进度条背景圆环 */}
                  <svg
                    width="80"
                    height="80"
                    className="transform -rotate-90"
                    style={{ position: 'absolute' }}
                  >
                    {/* 背景圆环 */}
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                    />
                    {/* 进度圆环 */}
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#FF0000"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - boredomProgress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* 进度数值 */}
                  <span
                    className="font-bold"
                    style={{
                      fontSize: '18px',
                      color: '#FF0000',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {boredomProgress}
                  </span>
                </div>
              </div>

              {/* 3. Create Article Card - 创作文章（在底部，与退出键对齐） */}
              <div 
                style={{ ...cardStyle, padding: '16px' }}
                onClick={() => router.push('/create')}
                className="cursor-pointer transition-all duration-200 hover:shadow-md"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center mb-2">
                  <PencilSquareIcon className="w-5 h-5 mr-2" style={{ color: '#000000' }} />
                  <h3 className="text-base font-semibold" style={{ color: '#111827' }}>
                    创作文章
                  </h3>
                </div>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  今天你想写点什么呢
                </p>
              </div>
            </div>

            {/* Right Column - 日历 */}
            <div className="col-span-12 lg:col-span-4 lg:col-start-9" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {/* 1. Calendar Card - 日历 */}
              <div style={{ ...cardStyle, backgroundColor: '#2A2A2A', padding: '20px', width: '408px' }} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>日历</h3>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="flex items-center justify-center transition-colors hover:bg-gray-700 rounded"
                      style={{
                        width: '24px',
                        height: '24px',
                        color: '#D1D5DB',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>‹</span>
                    </button>
                    <span 
                      className="text-sm font-medium text-center"
                      style={{ 
                        color: '#D1D5DB',
                        minWidth: '80px',
                      }}
                    >
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="flex items-center justify-center transition-colors hover:bg-gray-700 rounded"
                      style={{
                        width: '24px',
                        height: '24px',
                        color: '#D1D5DB',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>›</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 mb-2" style={{ gap: '4px' }}>
                  {weekDays.map((day) => (
                    <div 
                      key={day} 
                      className="text-center text-xs font-medium py-1"
                      style={{ color: '#9CA3AF' }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7" style={{ gap: '4px' }}>
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <div key={index} style={{ aspectRatio: '1' }} />
                    }
                    
                    const dayIsToday = isToday(day)
                    const dayIsLogged = isLoggedDate(day)
                    
                    // 确定日期样式（优先级：当前日期 > 已登录日期 > 普通日期）
                    let backgroundColor = 'transparent'
                    let color = '#9CA3AF' // 默认浅灰色
                    let borderRadius = '0px'
                    
                    if (dayIsToday) {
                      // 当前日期：白色圆形 + 黑色数字（最高优先级）
                      backgroundColor = '#FFFFFF'
                      color = '#000000'
                      borderRadius = '50%'
                    } else if (dayIsLogged) {
                      // 已登录日期：明亮的黄色圆形
                      backgroundColor = '#FFD700'
                      color = '#000000'
                      borderRadius = '50%'
                    } else {
                      // 普通日期：透明背景，浅灰色数字
                      color = '#9CA3AF'
                    }

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-center text-sm transition-all duration-200 cursor-pointer"
                        style={{
                          aspectRatio: '1',
                          backgroundColor,
                          color,
                          borderRadius,
                          fontWeight: dayIsToday ? '600' : '400',
                        }}
                        onMouseEnter={(e) => {
                          if (day && !dayIsToday && !dayIsLogged) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.borderRadius = '50%'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (day && !dayIsToday && !dayIsLogged) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.borderRadius = '0px'
                          }
                        }}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2. Music Player Card - 音乐播放器 */}
              <div 
                style={{ 
                  ...cardStyle, 
                  width: '408px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  marginTop: '80px',
                }}
              >
                {/* 顶部圆形封面 */}
                <div className="flex justify-center">
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E8B4E8 0%, #B4D8E8 50%, #E8B4E8 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 纹理效果 */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
                      }}
                    />
                    {/* 白色圆形播放按钮 */}
                    <button
                      className="flex items-center justify-center"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2,
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {/* 黑色播放三角 */}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ marginLeft: '1px' }}
                      >
                        <path
                          d="M8 5V19L19 12L8 5Z"
                          fill="#000000"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 声波进度条 */}
                <div>
                  {/* 声波可视化 */}
                  <div 
                    className="flex items-end justify-center"
                    style={{
                      height: '48px',
                      gap: '4px',
                      marginBottom: '8px',
                    }}
                  >
                    {/* 已播放部分 - 深蓝色声波 */}
                    {[3, 12, 18, 9, 15, 21, 12, 9, 15, 18, 12, 9, 12, 15].map((height, index) => (
                      <div
                        key={index}
                        style={{
                          width: '4px',
                          height: `${height}px`,
                          backgroundColor: '#1E3A8A',
                          borderRadius: '2px',
                        }}
                      />
                    ))}
                    {/* 未播放部分 - 浅灰色声波 */}
                    {[6, 9, 6, 7.5, 9, 7.5, 6, 9, 7.5, 6, 9, 7.5, 6, 9].map((height, index) => (
                      <div
                        key={`unplayed-${index}`}
                        style={{
                          width: '4px',
                          height: `${height}px`,
                          backgroundColor: '#E5E7EB',
                          borderRadius: '2px',
                          opacity: 0.6,
                        }}
                      />
                    ))}
                  </div>
                  {/* 时间显示 */}
                  <div 
                    className="flex items-center justify-center"
                    style={{
                      fontSize: '12px',
                      color: '#9CA3AF',
                      gap: '8px',
                    }}
                  >
                    <span>0:39</span>
                    <span>•</span>
                    <span>6:28</span>
                  </div>
                </div>

                {/* 底部控制图标 */}
                <div 
                  className="flex items-center justify-center"
                  style={{
                    gap: '32px',
                  }}
                >
                  {/* 分享图标 */}
                  <button
                    className="flex items-center justify-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <ShareIcon 
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#000000',
                      }}
                    />
                  </button>
                  
                  {/* 更多选项图标 */}
                  <button
                    className="flex items-center justify-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <EllipsisHorizontalIcon 
                      style={{
                        width: '24px',
                        height: '24px',
                        color: '#000000',
                      }}
                    />
                  </button>
                  
                  {/* 心形图标 */}
                  <button
                    className="flex items-center justify-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <HeartIcon 
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#000000',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
      </div>
    </div>
  )
}
