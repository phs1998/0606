'use client'

import { useState, useEffect } from 'react'

export default function AvatarWithFrame({ userId, size = 'md', className = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [avatarData, setAvatarData] = useState({
    avatarUrl: null,
    frameUrl: null,
    username: null,
  })

  // Size mapping
  const sizeMap = {
    sm: {
      avatar: 'w-8 h-8', // 32px
      frameScale: '125%', // 125% of 32px = 40px (integer)
      text: 'text-xs',
    },
    md: {
      avatar: 'w-12 h-12', // 48px
      frameScale: '129.17%', // 129.17% of 48px = 62px (integer)
      text: 'text-sm',
    },
    lg: {
      avatar: 'w-16 h-16', // 64px
      frameScale: '134.375%', // 134.375% of 64px = 86px (integer)
      text: 'text-base',
    },
    xl: {
      avatar: 'w-24 h-24', // 96px
      frameScale: '140.625%', // 140.625% of 96px = 135px (integer)
      text: 'text-lg',
    },
    '2xl': { // New size for larger display
      avatar: 'w-32 h-32', // 128px
      frameScale: '168.75%', // 168.75% of 128px = 216px (integer)
      text: 'text-xl',
    },
  }

  const currentSize = sizeMap[size] || sizeMap.md

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchAvatarData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/user/avatar/${userId}?t=${Date.now()}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('获取头像数据失败')
        }

        const result = await response.json()
        if (result.success && result.data) {
          setAvatarData({
            avatarUrl: result.data.avatar_url || null,
            frameUrl: result.data.frame_url || null,
            username: result.data.username || null,
          })
        }
      } catch (err) {
        console.error('获取头像数据错误:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAvatarData()

    // 监听头像更新事件，强制刷新
    const handleAvatarUpdate = () => {
      if (userId) {
        fetchAvatarData()
      }
    }

    window.addEventListener('avatar_updated', handleAvatarUpdate)
    return () => {
      window.removeEventListener('avatar_updated', handleAvatarUpdate)
    }
  }, [userId])

  if (loading) {
    return (
      <div className={`${currentSize.avatar} rounded-full bg-gray-200 animate-pulse ${className}`} />
    )
  }

  if (error) {
    return (
      <div className={`${currentSize.avatar} rounded-full bg-gray-300 flex items-center justify-center ${className}`}>
        <span className={`${currentSize.text} text-gray-500`}>?</span>
      </div>
    )
  }

  const usernameInitial = avatarData.username ? avatarData.username.charAt(0).toUpperCase() : '?'

  return (
    <div className={`relative inline-block ${className}`} style={{ overflow: 'visible', lineHeight: 0 }}> {/* Allow frame to overflow */}
      {/* Avatar container */}
      <div className={`relative ${currentSize.avatar} rounded-full overflow-hidden`} style={{ position: 'relative', display: 'block' }}>
        {/* User Avatar (bottom layer) */}
        {avatarData.avatarUrl ? (
          <img
            src={avatarData.avatarUrl}
            srcSet={`${avatarData.avatarUrl} 1x, ${avatarData.avatarUrl} 2x`}
            alt={avatarData.username || '用户头像'}
            className="w-full h-full rounded-full"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              width: '100%',
              height: '100%',
              imageRendering: 'high-quality',
              WebkitImageRendering: '-webkit-optimize-contrast',
              msImageRendering: 'crisp-edges',
            }}
            loading="eager"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        
        {/* Default Avatar */}
        <div
          className={`w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold ${currentSize.text}`}
          style={{ display: avatarData.avatarUrl ? 'none' : 'flex' }}
        >
          {usernameInitial}
        </div>
      </div>

      {/* Avatar Frame (top layer, absolute positioning, covers avatar) */}
      {avatarData.frameUrl && (() => {
        const basePixels = {
          'w-8': 32, 'w-12': 48, 'w-16': 64, 'w-24': 96, 'w-32': 128,
        }[currentSize.avatar.split(' ')[0]] || 48
        
        const scalePercent = parseFloat(currentSize.frameScale) / 100
        const framePixels = Math.round(basePixels * scalePercent)
        
        return (
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${framePixels}px`,
              height: `${framePixels}px`,
              zIndex: 1,
            }}
          >
            <img
              src={avatarData.frameUrl}
              srcSet={`${avatarData.frameUrl} 1x, ${avatarData.frameUrl} 2x`}
              alt="头像框"
              className="w-full h-full"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                objectFit: 'contain',
                imageRendering: 'crisp-edges',
                WebkitImageRendering: '-webkit-optimize-contrast',
                msImageRendering: 'crisp-edges',
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        )
      })()}
    </div>
  )
}





