'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import {
  ChatBubbleLeftRightIcon,
  GiftIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import AvatarWithFrame from '@/components/AvatarWithFrame'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDetailsElement>(null)

  const calculateLevel = (exp: number = 0): number => {
    return Math.floor(exp / 100) + 1
  }

  const userLevel = user?.exp ? calculateLevel(user.exp) : 1

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch unread mentions count
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
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    // Listen for mentions-updated event
    const handleMentionsUpdated = () => {
      fetchUnreadCount()
    }
    window.addEventListener('mentions-updated', handleMentionsUpdated)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('mentions-updated', handleMentionsUpdated)
    }
  }, [user?.id])

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleMenuItemClick = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setIsMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 vapor-navbar-scanlines">
      {/* 毛玻璃背景 */}
      <div className="vapor-frosted w-full" style={{
        borderBottom: '2px solid var(--vapor-pink)',
        boxShadow: 'var(--glow-pink)',
      }}>
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left Logo */}
          <Link 
            href="/home" 
            className="text-2xl font-bold vapor-gradient-text-pink-cyan vapor-glitch-hover"
            style={{
              marginLeft: '1rem',
              marginRight: 0,
              fontFamily: 'monospace',
              letterSpacing: '2px',
            }}
          >
            AOI
          </Link>

          {/* Right User Info */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-vapor-cyan border-t-transparent rounded-full animate-spin" style={{
                boxShadow: 'var(--glow-cyan)',
              }}></div>
            ) : user ? (
              <details 
                ref={menuRef}
                className="relative"
                open={isMenuOpen}
                onToggle={(e) => {
                  setIsMenuOpen((e.target as HTMLDetailsElement).open)
                }}
              >
                <summary className="flex items-center gap-2 cursor-pointer list-none vapor-glitch-hover">
                  {/* User Avatar (using AvatarWithFrame component) */}
                  {user.id && (
                    <AvatarWithFrame userId={user.id} size="sm" className="flex-shrink-0" />
                  )}
                  {/* User Level */}
                  <span className="text-sm font-medium whitespace-nowrap vapor-gradient-text-pink-cyan" style={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                  }}>
                    LV.{userLevel}
                  </span>
                  {/* Dropdown Arrow */}
                  <svg 
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${isMenuOpen ? 'transform rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{
                      color: 'var(--vapor-cyan)',
                      filter: 'drop-shadow(0 0 3px var(--vapor-cyan))',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                {/* Dropdown Menu - Windows 95风格 */}
                <div className="vapor-win95-menu" style={{
                  position: 'absolute',
                  bottom: 'auto',
                  left: 'auto',
                  right: '0',
                  top: '100%',
                  marginTop: '8px',
                }}>
                  {/* 菜单标题栏 */}
                  <div className="vapor-win95-menu-header">
                    <span className="vapor-pixel-icon">☰</span>
                    <span>开始菜单</span>
                  </div>
                  
                  {/* 菜单内容 - 带桌面图案背景 */}
                  <div className="vapor-win95-menu-content">
                    <Link
                      href="/messages"
                      onClick={handleMenuItemClick}
                      className={`vapor-win95-menu-item ${pathname === '/messages' ? 'active' : ''}`}
                    >
                      <span className="vapor-pixel-icon">✉</span>
                      <span className="vapor-win95-menu-item-text">消息</span>
                      {unreadCount > 0 && (
                        <span style={{ 
                          fontSize: '9px',
                          background: '#ff0000',
                          color: '#fff',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          fontWeight: 'bold',
                        }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      <span className="vapor-win95-menu-arrow">▶</span>
                    </Link>

                    <Link
                      href="/topics"
                      onClick={handleMenuItemClick}
                      className={`vapor-win95-menu-item ${pathname === '/topics' ? 'active' : ''}`}
                    >
                      <span className="vapor-pixel-icon">💬</span>
                      <span className="vapor-win95-menu-item-text">话题</span>
                      <span className="vapor-win95-menu-arrow">▶</span>
                    </Link>

                    <Link
                      href="/create"
                      onClick={handleMenuItemClick}
                      className={`vapor-win95-menu-item ${pathname === '/create' ? 'active' : ''}`}
                    >
                      <span className="vapor-pixel-icon">✨</span>
                      <span className="vapor-win95-menu-item-text">创作</span>
                      <span className="vapor-win95-menu-arrow">▶</span>
                    </Link>
                    
                    <div className="vapor-win95-menu-divider"></div>
                    
                    <Link
                      href="/lottery"
                      onClick={handleMenuItemClick}
                      className={`vapor-win95-menu-item ${pathname === '/lottery' ? 'active' : ''}`}
                    >
                      <span className="vapor-pixel-icon">🎁</span>
                      <span className="vapor-win95-menu-item-text">每日抽奖</span>
                      <span className="vapor-win95-menu-arrow">▶</span>
                    </Link>
                    
                    <Link
                      href="/profile"
                      onClick={handleMenuItemClick}
                      className={`vapor-win95-menu-item ${pathname === '/profile' ? 'active' : ''}`}
                    >
                      <span className="vapor-pixel-icon">👤</span>
                      <span className="vapor-win95-menu-item-text">修改资料</span>
                      <span className="vapor-win95-menu-arrow">▶</span>
                    </Link>
                    
                    <div className="vapor-win95-menu-divider"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="vapor-win95-menu-item"
                    >
                      <span className="vapor-pixel-icon">🚪</span>
                      <span className="vapor-win95-menu-item-text">退出登录</span>
                      <span className="vapor-win95-menu-arrow">▶</span>
                    </button>
                  </div>
                </div>
              </details>
            ) : (
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium rounded-md vapor-retro-button vapor-glow-border vapor-glitch-hover"
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                <span className="vapor-gradient-text-pink-cyan">登录</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

