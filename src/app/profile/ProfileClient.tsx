'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ImageUploader from '@/components/ImageUploader'
import { revalidateProfileCache } from './actions'
import PreviewModal from '@/components/PreviewModal'
import { BACKGROUND_OPTIONS, getBackgroundById } from '@/lib/backgrounds'

interface UserProfileResponse {
  user: {
    id: string
    username: string
    email: string
    avatar_url?: string | null
    exp: number
    registration_number: number
    registration_number_display: string
    equipped_avatar_frame_id?: string | null
    created_at: string
  }
  profile: {
    bio?: string | null
    background_image_url?: string | null
  } | null
  unlocked_avatar_frames: any[]
  equipped_avatar_frame: any | null
  total_likes_received: number
  allFrames: any[]
}

interface RewardsResponse {
  rewards: any[]
  total: number
}

interface ProfileClientProps {
  initialProfileData: UserProfileResponse
  initialRewardsData: RewardsResponse
  token: string
}

export default function ProfileClient({
  initialProfileData,
  initialRewardsData,
  token,
}: ProfileClientProps) {
  const router = useRouter()
  const { refreshUser } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'basic' | 'equipment'>('basic')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [profileData, setProfileData] = useState<UserProfileResponse>(initialProfileData)
  const [bio, setBio] = useState(initialProfileData.profile?.bio || '')
  
  // Background image selection
  // 如果background_image_url是null或undefined，使用'default'
  // 如果是空字符串，也使用'default'
  // 否则使用实际的背景ID
  const getInitialBackgroundId = () => {
    const bgId = initialProfileData.profile?.background_image_url
    if (!bgId || (typeof bgId === 'string' && bgId.trim() === '')) {
      return 'default'
    }
    return bgId
  }
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(getInitialBackgroundId())
  
  // Original data (from server)
  const [avatarUrl, setAvatarUrl] = useState(initialProfileData.user?.avatar_url || '')
  
  // New uploaded file URLs (temporary state for preview and saving)
  const [avatarFile, setAvatarFile] = useState<string | null>(null)
  
  // URLs used for display (prioritize new uploads, otherwise use original data)
  const displayAvatarUrl = avatarFile || avatarUrl || ''

  const [rewardsData, setRewardsData] = useState<RewardsResponse>(initialRewardsData)

  // Preview Modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<{ type: 'avatar_frame'; item: any } | null>(null)

  // Change count limit states
  const [avatarChangesCount, setAvatarChangesCount] = useState<number | null>(null)
  const [loadingChangeCounts, setLoadingChangeCounts] = useState(false)

  const checkChangeCounts = async () => {
    setLoadingChangeCounts(true)
    try {
      const token = sessionStorage.getItem('token')
      if (!token) return

      const avatarRes = await fetch('/api/profile/change-count?type=avatar', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      })

      if (avatarRes.ok) {
        const avatarData = await avatarRes.json()
        if (avatarData.success) {
          setAvatarChangesCount(avatarData.data.count)
        }
      }
    } catch (error) {
      console.error('获取修改次数错误:', error)
    } finally {
      setLoadingChangeCounts(false)
    }
  }

  // 延迟加载修改次数，不影响首屏渲染
  useEffect(() => {
    // 使用setTimeout延迟执行，让页面先渲染
    const timer = setTimeout(() => {
      checkChangeCounts()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const reloadData = async () => {
    try {
      const token = sessionStorage.getItem('token')
      if (!token) return

      const [profileRes, rewardsRes] = await Promise.all([
        fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/user/rewards', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
          cache: 'no-store',
        }),
      ])

      if (profileRes.ok) {
        const profileResult = await profileRes.json()
        if (profileResult.success) {
          setProfileData(profileResult.data)
          setBio(profileResult.data.profile?.bio || '')
          setAvatarUrl(profileResult.data.user?.avatar_url || '')
          // 正确读取背景ID：null或空字符串时使用'default'，否则使用实际ID
          const bgId = profileResult.data.profile?.background_image_url
          setSelectedBackgroundId((bgId && bgId.trim()) || 'default')
        }
      }

      if (rewardsRes.ok) {
        const rewardsResult = await rewardsRes.json()
        if (rewardsResult.success) {
          setRewardsData(rewardsResult.data)
        }
      }

      await checkChangeCounts()
    } catch (error) {
      console.error('重新加载数据错误:', error)
    }
  }

  const handleAvatarUploadComplete = (url: string) => {
    setAvatarFile(url)
  }

  const handleSaveBasic = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const updateData: any = {
        bio: bio.trim(),
        avatar_url: avatarFile || avatarUrl || null,
        background_image_id: selectedBackgroundId === 'default' ? null : selectedBackgroundId,
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        
        // Update original data
        if (result.data?.user?.avatar_url !== undefined) {
          setAvatarUrl(result.data.user.avatar_url || '')
        }
        if (result.data?.profile?.bio !== undefined) {
          setBio(result.data.profile.bio || '')
        }
        // Update background ID
        // 正确读取背景ID：null或空字符串时使用'default'，否则使用实际ID
        if (result.data?.profile?.background_image_url !== undefined) {
          const bgId = result.data.profile.background_image_url
          setSelectedBackgroundId((bgId && bgId.trim()) || 'default')
        }
        
        // Clear temporary states
        setAvatarFile(null)
        
        await revalidateProfileCache()
        await refreshUser()
        await reloadData()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        if (response.status === 429) {
          setError(result.error || '本月修改次数已达上限')
        } else {
          setError(result.error || '保存失败')
        }
      }
    } catch (error) {
      console.error('保存资料错误:', error)
      setError('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleEquipFrame = async (frameId: string) => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ equipped_avatar_frame_id: frameId }),
      })

      const result = await response.json()
      if (response.ok && result.success) {
        await reloadData()
        await refreshUser()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || '装备失败')
      }
    } catch (error) {
      console.error('装备头像框错误:', error)
      setError('装备失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const unlockedFrameIds = new Set(profileData?.unlocked_avatar_frames?.map((frame) => frame.id) || [])
  const equippedFrameId = profileData?.user?.equipped_avatar_frame_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">个人资料</h1>

          {/* Tab Switching */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              基本资料
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'equipment'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              个性化装备
            </button>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              保存成功！
            </div>
          )}

          {/* Basic Profile Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">个性签名</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="介绍一下自己..."
                />
              </div>

              {/* Background Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">个人主页背景</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {BACKGROUND_OPTIONS.map((bg) => {
                    const isSelected = selectedBackgroundId === bg.id
                    const bgUrl = bg.url || null
                    
                    return (
                      <div
                        key={bg.id}
                        onClick={() => setSelectedBackgroundId(bg.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          aspectRatio: '16/9',
                          minHeight: '100px',
                        }}
                      >
                        {bgUrl ? (
                          <>
                            <img
                              loading="lazy"
                              src={bgUrl}
                              alt={bg.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 如果图片加载失败，显示默认背景
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.style.background = 'var(--vapor-gradient-pink-purple)'
                                }
                              }}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-indigo-600 bg-opacity-30 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">已选择</span>
                              </div>
                            )}
                          </>
                        ) : (
                          // 默认背景预览（使用CSS渐变）
                          <div
                            className="w-full h-full"
                            style={{
                              background: `
                                var(--grid-bg),
                                var(--vapor-gradient-pink-purple)
                              `,
                              backgroundSize: '20px 20px, 100% 100%',
                            }}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 bg-indigo-600 bg-opacity-30 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">已选择</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                          {bg.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  当前选择：{getBackgroundById(selectedBackgroundId).name}
                </p>
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">头像上传</label>
                {avatarChangesCount !== null && (
                  <p className="text-xs text-gray-500 mb-2">
                    本月已修改 {avatarChangesCount}/3 次
                    {avatarChangesCount >= 3 && (
                      <span className="text-red-600 ml-2">（已达上限）</span>
                    )}
                  </p>
                )}
                <ImageUploader
                  onUploadComplete={handleAvatarUploadComplete}
                  maxSize={5 * 1024 * 1024}
                  type="avatar"
                  disabled={avatarChangesCount !== null && avatarChangesCount >= 3}
                />
                {displayAvatarUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      当前头像预览：
                      {avatarFile && (
                        <span className="text-indigo-600 ml-2">（新上传，待保存）</span>
                      )}
                    </p>
                    <img
                      src={displayAvatarUrl}
                      srcSet={`${displayAvatarUrl} 1x, ${displayAvatarUrl} 2x`}
                      alt="头像预览"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      style={{
                        imageRendering: 'high-quality',
                        WebkitImageRendering: '-webkit-optimize-contrast',
                        msImageRendering: 'crisp-edges',
                      }}
                      loading="eager"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end items-center gap-4">
                {avatarFile && (
                  <span className="text-sm text-indigo-600">
                    有新上传的图片待保存
                  </span>
                )}
                <button
                  onClick={handleSaveBasic}
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : '保存资料'}
                </button>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className="space-y-8">
              {/* Avatar Frames Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">我的头像框</h2>
                {profileData?.allFrames && profileData.allFrames.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profileData.allFrames.map((frame) => {
                      const isUnlocked = unlockedFrameIds.has(frame.id)
                      const isEquipped = equippedFrameId === frame.id

                      return (
                        <div
                          key={frame.id}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            isUnlocked
                              ? 'border-gray-200 bg-white hover:shadow-md'
                              : 'border-gray-300 bg-gray-100 opacity-60'
                          } ${
                            isEquipped
                              ? 'ring-2 ring-indigo-500 border-indigo-500'
                              : ''
                          }`}
                        >
                          {/* Avatar Frame Preview */}
                          <div className="aspect-square mb-3 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                            {frame.image_url ? (
                              <img
                              loading="lazy"
                                src={frame.image_url}
                                alt={frame.name}
                                className={`w-full h-full object-cover ${!isUnlocked ? 'grayscale opacity-50' : ''}`}
                              />
                            ) : (
                              <div className="text-gray-400 text-sm text-center p-2">
                                {frame.name}
                              </div>
                            )}
                          </div>

                          {/* Avatar Frame Name */}
                          <div className="text-sm font-medium text-gray-800 mb-2 text-center">
                            {frame.name}
                          </div>

                          {/* Action Buttons or Unlock Condition */}
                          {isUnlocked ? (
                            <div className="space-y-2">
                              {isEquipped && (
                                <div className="text-xs text-center text-indigo-600 font-medium">
                                  已装备
                                </div>
                              )}
                              <button
                                onClick={() => handleEquipFrame(frame.id)}
                                disabled={isEquipped || saving}
                                className={`w-full py-2 text-sm rounded-lg transition-colors ${
                                  isEquipped
                                    ? 'bg-indigo-600 text-white cursor-default'
                                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {isEquipped ? '已装备' : '装备'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 text-center py-2">
                                {frame.unlock_condition}
                              </p>
                              <button
                                onClick={() => {
                                  setPreviewItem({ type: 'avatar_frame', item: frame })
                                  setIsPreviewOpen(true)
                                }}
                                className="w-full py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                预览
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    暂无头像框数据
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          previewData={previewItem}
        />
      </div>
    </div>
  )
}

