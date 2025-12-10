'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import ProfilePreview from '@/components/profile/ProfilePreview'
import Link from 'next/link'

interface ProfileData {
  user: {
    id: string
    username: string
    avatar_url?: string | null
    exp: number
    equipped_avatar_frame_id?: string | null
    unlocked_name_color_id?: string | null
  }
  profile: {
    bio?: string | null
    background_image_url?: string | null
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
  const { user, loading: authLoading } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Click particles for vaporwave click effect
  const [clickParticles, setClickParticles] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
    color: string
    angle: number
    distance: number
    endX: number
    endY: number
  }>>([])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use lightweight preview API for faster loading
        const response = await fetch('/api/user/profile/preview', {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store', // Ensure fresh data, but API is optimized for speed
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setProfileData(data.data)
          
          // Preload background image in background (non-blocking)
          // Note: background_image_url might be a background ID, not a direct URL
          // The ProfilePreview component will handle the conversion
          if (data.data?.profile?.background_image_url) {
            // Only preload if it's a direct URL (starts with http)
            if (data.data.profile.background_image_url.startsWith('http')) {
              const img = new Image()
              img.src = data.data.profile.background_image_url
            }
          }
        } else {
          setError(data.error || '获取资料失败')
        }
      } catch (err) {
        console.error('获取用户资料错误:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Handle click particle effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const clickColors = [
        'rgba(236, 72, 153, 0.9)',   // pink
        'rgba(168, 85, 247, 0.9)',   // purple
        'rgba(217, 70, 239, 0.9)',   // fuchsia
        'rgba(139, 92, 246, 0.9)',   // violet
        'rgba(192, 132, 252, 0.9)',  // light purple
        'rgba(251, 113, 133, 0.9)',  // rose
      ]

      // Create 8-12 particles per click
      const particleCount = Math.floor(Math.random() * 5) + 8
      const newClickParticles = Array.from({ length: particleCount }, (_, i) => {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
        const distance = Math.random() * 100 + 80
        const endX = Math.cos(angle) * distance
        const endY = Math.sin(angle) * distance
        return {
          id: Date.now() + i,
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 12 + 8, // 8-20px
          color: clickColors[Math.floor(Math.random() * clickColors.length)],
          angle: angle,
          distance: distance,
          endX: endX,
          endY: endY,
        }
      })

      setClickParticles((prev) => [...prev, ...newClickParticles])

      // Remove particles after animation (1.5s)
      setTimeout(() => {
        setClickParticles((prev) => prev.filter((p) => !newClickParticles.includes(p)))
      }, 1500)
    }

    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [])


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a2c5a 50%, #6b3a7a 75%, #8b4a9a 100%)',
      }}>
        <div className="text-pink-300" style={{ fontFamily: 'monospace' }}>加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a2c5a 50%, #6b3a7a 75%, #8b4a9a 100%)',
      }}>
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold text-pink-300 mb-4" style={{ fontFamily: 'monospace' }}>欢迎来到 AOI</h1>
          <p className="text-pink-200 mb-8" style={{ fontFamily: 'monospace' }}>个人介绍与轻社区</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg transition-colors"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(168, 85, 247, 0.6) 100%)',
              color: '#ffffff',
              border: '2px solid rgba(236, 72, 153, 0.5)',
              fontFamily: 'monospace',
            }}
          >
            登录 / 注册
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a2c5a 50%, #6b3a7a 75%, #8b4a9a 100%)',
      }}>
        <div className="text-center relative z-10">
          <p className="text-red-400 mb-4" style={{ fontFamily: 'monospace' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(168, 85, 247, 0.6) 100%)',
              color: '#ffffff',
              border: '2px solid rgba(236, 72, 153, 0.5)',
              fontFamily: 'monospace',
            }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a2c5a 50%, #6b3a7a 75%, #8b4a9a 100%)',
    }}>
      {/* Vaporwave Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.15) 2px, transparent 2px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.15) 2px, transparent 2px)
            `,
            backgroundSize: '40px 40px',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Vaporwave Sun */}
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full opacity-20" style={{
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'pulse 4s ease-in-out infinite',
      }} />

      {/* Vaporwave Grid Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)',
          transform: 'rotate(-45deg)',
          transformOrigin: 'center',
        }} />
      </div>

      {/* Click Particles - Vaporwave Style */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {clickParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute click-particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              border: `2px solid ${particle.color.replace('0.9', '1')}`,
              boxShadow: `0 0 ${particle.size}px ${particle.color}, inset 0 0 ${particle.size / 2}px ${particle.color}`,
              transformOrigin: 'center',
              imageRendering: 'pixelated',
              willChange: 'transform, opacity',
              marginLeft: `-${particle.size / 2}px`,
              marginTop: `-${particle.size / 2}px`,
              '--end-x': `${particle.endX}px`,
              '--end-y': `${particle.endY}px`,
            } as React.CSSProperties & { '--end-x': string; '--end-y': string }}
          />
        ))}
      </div>

      {/* 左侧流动动画元素 */}
      <div className="absolute left-0 top-0 bottom-0 w-64 pointer-events-none z-5" style={{ overflow: 'hidden' }}>
        {/* 旧台式电脑 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-medium vapor-floating-pink" style={{ left: '20px', animationDelay: '0s' }}>
          💻
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-small vapor-floating-cyan" style={{ left: '40px', animationDelay: '3s' }}>
          🖥️
        </div>
        
        {/* 日语文字 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-small vapor-floating-purple" style={{ left: '60px', animationDelay: '6s', fontSize: '1.5rem', fontFamily: 'monospace' }}>
          エーテル
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-small vapor-floating-pink" style={{ left: '30px', animationDelay: '9s', fontSize: '1.2rem', fontFamily: 'monospace' }}>
          ヴェイパーウェーブ
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-small vapor-floating-cyan" style={{ left: '50px', animationDelay: '12s', fontSize: '1.3rem', fontFamily: 'monospace' }}>
          未来
        </div>
        
        {/* 椰子树 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-large vapor-floating-pink" style={{ left: '80px', animationDelay: '2s' }}>
          🌴
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-medium vapor-floating-cyan" style={{ left: '100px', animationDelay: '8s' }}>
          🌴
        </div>
        
        {/* 金字塔 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-medium vapor-floating-purple" style={{ left: '120px', animationDelay: '4s' }}>
          🔺
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-small vapor-floating-pink" style={{ left: '140px', animationDelay: '10s' }}>
          ⚡
        </div>
        
        {/* 彩虹 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-rainbow vapor-floating-large" style={{ left: '10px', animationDelay: '5s' }}>
          🌈
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-medium vapor-floating-cyan" style={{ left: '70px', animationDelay: '11s' }}>
          ✨
        </div>
        
        {/* 古典雕塑 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-medium vapor-floating-purple" style={{ left: '90px', animationDelay: '7s' }}>
          🗿
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-small vapor-floating-pink" style={{ left: '110px', animationDelay: '13s' }}>
          🏛️
        </div>
      </div>

      {/* 右侧流动动画元素 */}
      <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none z-5" style={{ overflow: 'hidden' }}>
        {/* 旧台式电脑 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-medium vapor-floating-pink" style={{ right: '20px', animationDelay: '1s' }}>
          💻
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-small vapor-floating-cyan" style={{ right: '40px', animationDelay: '4s' }}>
          🖥️
        </div>
        
        {/* 日语文字 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-small vapor-floating-purple" style={{ right: '60px', animationDelay: '7s', fontSize: '1.5rem', fontFamily: 'monospace' }}>
          エーテル
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-small vapor-floating-pink" style={{ right: '30px', animationDelay: '10s', fontSize: '1.2rem', fontFamily: 'monospace' }}>
          ヴェイパーウェーブ
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-small vapor-floating-cyan" style={{ right: '50px', animationDelay: '13s', fontSize: '1.3rem', fontFamily: 'monospace' }}>
          未来
        </div>
        
        {/* 椰子树 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-large vapor-floating-pink" style={{ right: '80px', animationDelay: '3s' }}>
          🌴
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-medium vapor-floating-cyan" style={{ right: '100px', animationDelay: '9s' }}>
          🌴
        </div>
        
        {/* 金字塔 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-medium vapor-floating-purple" style={{ right: '120px', animationDelay: '5s' }}>
          🔺
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-small vapor-floating-pink" style={{ right: '140px', animationDelay: '11s' }}>
          ⚡
        </div>
        
        {/* 彩虹 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-rainbow vapor-floating-large" style={{ right: '10px', animationDelay: '6s' }}>
          🌈
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-medium vapor-floating-cyan" style={{ right: '70px', animationDelay: '12s' }}>
          ✨
        </div>
        
        {/* 古典雕塑 */}
        <div className="vapor-floating-side-element vapor-floating-side-element-float-down vapor-floating-medium vapor-floating-purple" style={{ right: '90px', animationDelay: '8s' }}>
          🗿
        </div>
        <div className="vapor-floating-side-element vapor-floating-side-element-float-up vapor-floating-small vapor-floating-pink" style={{ right: '110px', animationDelay: '14s' }}>
          🏛️
        </div>
      </div>

      {/* Main Content - 个人主页作为主站界面 */}
      <div className="relative z-10 overflow-y-auto" style={{
        position: 'absolute',
        top: '64px', // Align with navbar bottom (h-16 = 64px)
        left: '0',
        right: '0',
        bottom: '0',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        {/* Profile Preview - 作为主站界面，包含文章列表 */}
        <div style={{ 
          flexShrink: 0, 
          width: '100%',
          maxWidth: '1200px',
        }}>
          {profileData ? (
            <ProfilePreview
              user={profileData.user}
              profile={profileData.profile}
              equippedAvatarFrame={profileData.equipped_avatar_frame}
              equippedNameColor={profileData.equipped_name_color}
              totalLikesReceived={profileData.total_likes_received}
              showArticleList={true}
            />
          ) : (
            <div className="text-center text-pink-300" style={{ fontFamily: 'monospace' }}>
              <p>暂无资料</p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }

        .click-particle {
          animation: clickParticle 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes clickParticle {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--end-x, 0px)), calc(var(--end-y, 0px))) rotate(720deg) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}


