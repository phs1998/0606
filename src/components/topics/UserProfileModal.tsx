'use client'

import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth/client'
import ProfilePreview from '@/components/profile/ProfilePreview'

interface UserProfileModalProps {
  userId: string | null
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/users/${userId}/profile`, {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Ensure data structure is correct
          const profileData = data.data
          
          if (profileData && profileData.user) {
            // Ensure exp is a number
            if (typeof profileData.user.exp !== 'number') {
              profileData.user.exp = Number(profileData.user.exp) || 0
            }
            // Ensure total_likes_received is a number
            if (typeof profileData.total_likes_received !== 'number') {
              profileData.total_likes_received = Number(profileData.total_likes_received) || 0
            }
            setProfileData(profileData)
          } else {
            setError('数据格式错误')
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
  }, [userId])

  if (!userId) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a2c5a 50%, #6b3a7a 75%, #8b4a9a 100%)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            lineHeight: '1',
          }}
        >
          ×
        </button>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-pink-300" style={{ fontFamily: 'monospace' }}>
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400" style={{ fontFamily: 'monospace' }}>
              {error}
            </div>
          ) : profileData ? (
            <ProfilePreview
              user={profileData.user}
              profile={profileData.profile}
              equippedAvatarFrame={profileData.equipped_avatar_frame}
              equippedNameColor={profileData.equipped_name_color}
              totalLikesReceived={profileData.total_likes_received}
              showArticleList={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

