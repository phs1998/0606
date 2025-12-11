'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import ArticleList from '@/components/articles/ArticleList'
import VaporwavePlayer from '@/components/music/VaporwavePlayer'

interface ProfilePreviewProps {
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
  equippedAvatarFrame: {
    id: string
    name: string
    image_url?: string | null
  } | null
  equippedNameColor: {
    id: string
    name: string
    color_code: string
  } | null
  totalLikesReceived: number
  showArticleList?: boolean
}

export default function ProfilePreview({
  user,
  profile,
  equippedAvatarFrame,
  equippedNameColor,
  totalLikesReceived,
  showArticleList = true,
}: ProfilePreviewProps) {
  const { user: currentUser } = useAuth()
  // 判断是否是当前用户自己的主页
  // 只有当 currentUser 存在且 ID 匹配时才显示音乐播放器
  const isOwnProfile = Boolean(currentUser?.id && user?.id && currentUser.id === user.id)

  const calculateLevel = (exp: number): number => {
    const expNum = Number(exp) || 0
    return Math.floor(expNum / 100) + 1
  }
  const userExp = Number(user?.exp) || 0
  const level = calculateLevel(userExp)
  const currentLevelExp = userExp % 100
  const expNeededForNextLevel = 100
  const useRainbowText = equippedNameColor?.name === '梦幻彩虹'
  const likesCount = Number(totalLikesReceived) || 0

  // 名片样式 - 使用淡黄色底色
  const cardStyle = useMemo(() => {
    return {
      border: '2px solid var(--vapor-pink)',
      boxShadow: 'var(--glow-pink), 0 8px 32px rgba(0, 0, 0, 0.3)',
      padding: '2rem',
      maxWidth: '100%',
      width: '100%',
      minHeight: '600px',
      position: 'relative' as const,
      backgroundColor: '#FFFBEB',
    }
  }, [])

  return (
    <div 
      className="rounded-xl relative overflow-hidden vapor-lo-fi-noise"
      style={cardStyle}
    >
      {/* 浮动元素：古典雕塑、椰树、日文字符 */}
      <div className="vapor-floating-element vapor-floating-slow" style={{ top: '10%', left: '5%', fontSize: '3rem' }}>
        🗿
      </div>
      <div className="vapor-floating-element vapor-floating-fast" style={{ top: '20%', right: '8%', fontSize: '2.5rem' }}>
        🌴
      </div>
      <div className="vapor-floating-element vapor-floating-slow" style={{ bottom: '15%', left: '10%', fontSize: '2rem', color: 'var(--vapor-cyan)' }}>
        エーテル
      </div>
      <div className="vapor-floating-element vapor-floating-fast" style={{ top: '50%', right: '5%', fontSize: '1.5rem', color: 'var(--vapor-purple)' }}>
        VAPORWAVE
      </div>
      <div className="vapor-floating-element vapor-floating-slow" style={{ bottom: '25%', right: '12%', fontSize: '2.5rem' }}>
        🏛️
      </div>
      
      {/* Content Area */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* 音乐播放器 - 只在查看自己的主页时显示 */}
        {isOwnProfile && <VaporwavePlayer />}
        
        {/* Avatar Area with CRT scanlines */}
        <div className="flex justify-center mb-8">
          {user.id && (
            <div className="vapor-crt-scanlines" style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <AvatarWithFrame userId={user.id} size="xl" />
            </div>
          )}
        </div>

        {/* Nickname with neon tube effect */}
        <div className="text-center mb-8">
          <h1 
            className={`text-4xl font-bold ${
              useRainbowText 
                ? 'rainbow-text' 
                : ''
            }`}
            style={{
              fontSize: '2.5rem',
              letterSpacing: '4px',
              color: '#ffffff',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.5)',
              fontFamily: 'monospace',
            }}
          >
            {user.username}
          </h1>
        </div>

        {/* Total Likes Received - 复古窗口样式 */}
        <div className="text-center mb-8">
          <div className="vapor-retro-window inline-block" style={{ minWidth: '200px' }}>
            <div className="vapor-retro-window-header">
              <span>STATS.EXE</span>
              <div className="vapor-retro-window-controls">
                <div className="vapor-retro-window-button">_</div>
                <div className="vapor-retro-window-button">□</div>
                <div className="vapor-retro-window-button">×</div>
              </div>
            </div>
            <div className="vapor-retro-window-content">
              <div style={{ 
                color: 'var(--vapor-pink)',
                fontWeight: 'bold',
                fontSize: '14px',
                textShadow: '0 0 5px var(--vapor-pink)',
              }}>
                获赞总数: <span style={{ color: '#000', fontSize: '16px' }}>{likesCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Bar - 复古窗口样式 */}
        <div className="mb-6">
          <div className="vapor-retro-window">
            <div className="vapor-retro-window-header">
              <span>LEVEL.EXE</span>
              <div className="vapor-retro-window-controls">
                <div className="vapor-retro-window-button">_</div>
                <div className="vapor-retro-window-button">□</div>
                <div className="vapor-retro-window-button">×</div>
              </div>
            </div>
            <div className="vapor-retro-window-content">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold" style={{ color: '#000' }}>经验值</span>
                <span className="text-sm font-bold" style={{ color: '#000' }}>
                  {currentLevelExp}/{expNeededForNextLevel}
                </span>
              </div>
              <div className="w-full rounded-full h-4 overflow-hidden" style={{
                background: '#c0c0c0',
                border: '2px inset #c0c0c0',
              }}>
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, (currentLevelExp / expNeededForNextLevel) * 100))}%`,
                    background: 'var(--vapor-gradient-pink-purple)',
                    boxShadow: 'var(--glow-pink)',
                  }}
                ></div>
              </div>
              <div className="text-center mt-3 text-xs" style={{ color: '#000' }}>
                距离下一级还需 <span style={{ fontWeight: 'bold' }}>{expNeededForNextLevel - currentLevelExp}</span> 经验
              </div>
            </div>
          </div>
        </div>

        {/* Bio - 复古窗口样式 */}
        {profile?.bio && (
          <div className="mb-6">
            <div className="vapor-retro-window">
              <div className="vapor-retro-window-header">
                <span>BIO.TXT</span>
                <div className="vapor-retro-window-controls">
                  <div className="vapor-retro-window-button">_</div>
                  <div className="vapor-retro-window-button">□</div>
                  <div className="vapor-retro-window-button">×</div>
                </div>
              </div>
              <div className="vapor-retro-window-content">
                <div style={{ 
                  color: '#000',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {profile.bio}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Article List - 集成在个人主页内 */}
        {showArticleList && user.id && (
          <div className="mt-8">
            <div className="vapor-retro-window">
              <div className="vapor-retro-window-header">
                <span>ARTICLES.EXE</span>
                <div className="vapor-retro-window-controls">
                  <div className="vapor-retro-window-button">_</div>
                  <div className="vapor-retro-window-button">□</div>
                  <div className="vapor-retro-window-button">×</div>
                </div>
              </div>
              <div className="vapor-retro-window-content" style={{ padding: '0' }}>
                <div style={{ padding: '12px' }}>
                  <ArticleList userId={user.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


