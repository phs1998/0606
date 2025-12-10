'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberPassword, setRememberPassword] = useState(false)

  // Register form state
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  // Particle squares for vaporwave animation
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    size: number
    duration: number
    delay: number
    color: string
    letter: string
    rotation: number
  }>>([])

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
    // If user is already logged in, redirect to home
    if (user) {
      router.push('/home')
    }
    
    // Load saved email and password from localStorage
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('rememberedEmail')
      const savedPassword = localStorage.getItem('rememberedPassword')
      if (savedEmail && savedPassword) {
        setLoginEmail(savedEmail)
        setLoginPassword(savedPassword)
        setRememberPassword(true)
      }
    }
  }, [user, router])

  useEffect(() => {
    // Generate vaporwave particle squares
    const colors = [
      'rgba(236, 72, 153, 0.6)',   // pink
      'rgba(168, 85, 247, 0.6)',   // purple
      'rgba(217, 70, 239, 0.6)',   // fuchsia
      'rgba(139, 92, 246, 0.6)',   // violet
      'rgba(192, 132, 252, 0.6)',  // light purple
    ]
    
    const letters = ['a', 'o', 'i']
    
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // 0-100% horizontal position
      size: Math.random() * 40 + 20, // 20-60px
      duration: Math.random() * 10 + 15, // 15-25s animation duration
      delay: Math.random() * 5, // 0-5s delay
      color: colors[Math.floor(Math.random() * colors.length)],
      letter: letters[Math.floor(Math.random() * letters.length)],
      rotation: Math.random() * 360, // 0-360 degrees
    }))
    
    setParticles(newParticles)
  }, [])

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

      // Trigger animation by setting a small delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Animation will be triggered by CSS
        })
      })

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store token in sessionStorage (cleared when tab closes)
        if (data.data.token) {
          sessionStorage.setItem('token', data.data.token)
        }

        // Save email and password if "Remember Password" is checked
        if (rememberPassword && typeof window !== 'undefined') {
          localStorage.setItem('rememberedEmail', loginEmail)
          localStorage.setItem('rememberedPassword', loginPassword)
        } else if (typeof window !== 'undefined') {
          // Clear saved credentials if not remembering
          localStorage.removeItem('rememberedEmail')
          localStorage.removeItem('rememberedPassword')
        }

        // Update auth context
        if (data.data.user) {
          login(data.data.token, {
            id: data.data.user.id,
            username: data.data.user.username,
            email: data.data.user.email,
            registration_number: data.data.user.registration_number,
            avatar_url: data.data.user.avatar_url,
          })
        }

        // Redirect to home page
        router.push('/home')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      console.error('登录错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      // 检查响应状态
      if (response.status === 404) {
        setError('注册接口未找到，请检查服务器配置')
        console.error('注册接口返回 404，可能的原因：')
        console.error('1. 路由文件未正确部署')
        console.error('2. Next.js 构建时排除了该路由')
        console.error('3. Vercel 部署配置问题')
        return
      }

      // 尝试解析 JSON 响应
      let data
      try {
        const text = await response.text()
        if (!text) {
          setError('服务器返回空响应')
          return
        }
        data = JSON.parse(text)
      } catch (parseError) {
        console.error('解析响应失败:', parseError)
        setError('服务器响应格式错误')
        return
      }

      if (response.ok && data.success) {
        // Store token in sessionStorage (cleared when tab closes)
        if (data.data.token) {
          sessionStorage.setItem('token', data.data.token)
        }

        // Update auth context
        if (data.data.user) {
          login(data.data.token, {
            id: data.data.user.id,
            username: data.data.user.username,
            email: data.data.user.email,
            registration_number: data.data.user.registration_number,
            avatar_url: null,
          })
        }

        // Redirect to home page
        router.push('/home')
      } else {
        setError(data.error || '注册失败')
        console.error('注册失败:', {
          status: response.status,
          error: data.error,
          code: data.code,
        })
      }
    } catch (err: any) {
      console.error('注册错误:', err)
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('网络连接失败，请检查网络连接')
      } else {
        setError('网络错误，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
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

      {/* Vaporwave Particle Squares - Floating Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((particle) => {
          // Extract color values for letter color (brighter version)
          const colorMatch = particle.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          let letterColor = 'rgba(255, 255, 255, 0.9)' // default white
          
          if (colorMatch) {
            const r = Math.min(255, parseInt(colorMatch[1]) + 50)
            const g = Math.min(255, parseInt(colorMatch[2]) + 50)
            const b = Math.min(255, parseInt(colorMatch[3]) + 50)
            letterColor = `rgba(${r}, ${g}, ${b}, 0.9)`
          }
          
          return (
            <div
              key={particle.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${particle.left}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: particle.color,
                border: `2px solid ${particle.color.replace('0.6', '0.9')}`,
                boxShadow: `0 0 ${particle.size / 2}px ${particle.color}, inset 0 0 ${particle.size / 4}px ${particle.color}`,
                animation: `floatUpDown ${particle.duration}s linear infinite`,
                animationDelay: `${particle.delay}s`,
                imageRendering: 'pixelated',
                transform: `rotate(${particle.rotation}deg)`,
                willChange: 'transform',
              }}
            >
              <span
                style={{
                  color: letterColor,
                  fontSize: `${Math.max(12, particle.size * 0.5)}px`,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: `0 0 ${particle.size / 3}px ${letterColor.replace('0.9', '0.8')}`,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transform: `rotate(${-particle.rotation}deg)`, // Counter-rotate letter to keep it upright
                }}
              >
                {particle.letter}
              </span>
            </div>
          )
        })}
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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Auth Card - Semi-transparent */}
          <div
            className="relative p-6 backdrop-blur-md"
            style={{
              background: 'rgba(26, 10, 46, 0.4)',
              border: '2px solid rgba(236, 72, 153, 0.3)',
              boxShadow: `
                0 0 20px rgba(236, 72, 153, 0.2),
                0 0 40px rgba(168, 85, 247, 0.1),
                inset 0 0 15px rgba(236, 72, 153, 0.05)
              `,
              imageRendering: 'pixelated',
            }}
          >
            {/* Corner Decorations - Pixel Style */}
            <div className="absolute top-0 left-0 w-4 h-4" style={{
              borderTop: '3px solid rgba(236, 72, 153, 0.4)',
              borderLeft: '3px solid rgba(236, 72, 153, 0.4)',
            }} />
            <div className="absolute top-0 right-0 w-4 h-4" style={{
              borderTop: '3px solid rgba(236, 72, 153, 0.4)',
              borderRight: '3px solid rgba(236, 72, 153, 0.4)',
            }} />
            <div className="absolute bottom-0 left-0 w-4 h-4" style={{
              borderBottom: '3px solid rgba(236, 72, 153, 0.4)',
              borderLeft: '3px solid rgba(236, 72, 153, 0.4)',
            }} />
            <div className="absolute bottom-0 right-0 w-4 h-4" style={{
              borderBottom: '3px solid rgba(236, 72, 153, 0.4)',
              borderRight: '3px solid rgba(236, 72, 153, 0.4)',
            }} />

            {/* Tab Switching - Vaporwave Style */}
            <div className="flex gap-2 mb-6" style={{
              borderBottom: '2px solid rgba(236, 72, 153, 0.3)',
            }}>
              <button
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                }}
                className={`flex-1 py-2 font-bold text-base transition-all ${
                  isLogin
                    ? 'text-white'
                    : 'text-pink-300 hover:text-pink-200'
                }`}
                style={{
                  fontFamily: 'monospace',
                  background: isLogin ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(168, 85, 247, 0.4) 100%)' : 'transparent',
                  borderBottom: isLogin ? '2px solid rgba(236, 72, 153, 0.5)' : 'none',
                  textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                }}
              >
                {'['} 登录 {']'}
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                }}
                className={`flex-1 py-2 font-bold text-base transition-all ${
                  !isLogin
                    ? 'text-white'
                    : 'text-pink-300 hover:text-pink-200'
                }`}
                style={{
                  fontFamily: 'monospace',
                  background: !isLogin ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(168, 85, 247, 0.4) 100%)' : 'transparent',
                  borderBottom: !isLogin ? '2px solid rgba(236, 72, 153, 0.5)' : 'none',
                  textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                }}
              >
                {'['} 注册 {']'}
              </button>
            </div>

            {/* Error Message - Vaporwave Style */}
            {error && (
              <div
                className="mb-4 p-3 font-bold text-sm"
                style={{
                  fontFamily: 'monospace',
                  border: '2px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(26, 10, 46, 0.5)',
                  color: '#fca5a5',
                  textShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                }}
              >
                {'>'} 错误: {error}
              </div>
            )}

            {/* Login Form - Vaporwave Style */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block font-bold mb-1.5 text-xs" style={{
                    fontFamily: 'monospace',
                    color: '#f0abfc',
                    textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                  }}>
                    {'>'} 邮箱
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm text-white transition-all"
                    style={{
                      fontFamily: 'monospace',
                      background: 'rgba(26, 10, 46, 0.4)',
                      border: '2px solid rgba(236, 72, 153, 0.3)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.6)'
                      e.target.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-xs" style={{
                    fontFamily: 'monospace',
                    color: '#f0abfc',
                    textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                  }}>
                    {'>'} 密码
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm text-white transition-all"
                    style={{
                      fontFamily: 'monospace',
                      background: 'rgba(26, 10, 46, 0.4)',
                      border: '2px solid rgba(236, 72, 153, 0.3)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.6)'
                      e.target.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="••••••••"
                  />
                </div>

                {/* Remember Password Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberPassword"
                    checked={rememberPassword}
                    onChange={(e) => setRememberPassword(e.target.checked)}
                    className="w-3.5 h-3.5 mr-2"
                    style={{
                      accentColor: 'rgba(236, 72, 153, 0.8)',
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="rememberPassword"
                    className="text-xs font-bold cursor-pointer"
                    style={{
                      fontFamily: 'monospace',
                      color: '#f0abfc',
                      textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                    }}
                  >
                    记住密码
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 font-black text-sm transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'monospace',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(168, 85, 247, 0.6) 100%)',
                    color: '#ffffff',
                    border: '2px solid rgba(236, 72, 153, 0.5)',
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                    textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {loading ? '处理中...' : '[ 执行登录 ]'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block font-bold mb-1.5 text-xs" style={{
                    fontFamily: 'monospace',
                    color: '#f0abfc',
                    textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                  }}>
                    {'>'} 用户名 (最多15个字符)
                  </label>
                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    maxLength={15}
                    className="w-full px-3 py-2 text-sm text-white transition-all"
                    style={{
                      fontFamily: 'monospace',
                      background: 'rgba(26, 10, 46, 0.4)',
                      border: '2px solid rgba(236, 72, 153, 0.3)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.6)'
                      e.target.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-xs" style={{
                    fontFamily: 'monospace',
                    color: '#f0abfc',
                    textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                  }}>
                    {'>'} 邮箱
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm text-white transition-all"
                    style={{
                      fontFamily: 'monospace',
                      background: 'rgba(26, 10, 46, 0.4)',
                      border: '2px solid rgba(236, 72, 153, 0.3)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.6)'
                      e.target.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-xs" style={{
                    fontFamily: 'monospace',
                    color: '#f0abfc',
                    textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
                  }}>
                    {'>'} 密码 (最少8个字符)
                  </label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 text-sm text-white transition-all"
                    style={{
                      fontFamily: 'monospace',
                      background: 'rgba(26, 10, 46, 0.4)',
                      border: '2px solid rgba(236, 72, 153, 0.3)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.6)'
                      e.target.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(236, 72, 153, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 font-black text-sm transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'monospace',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(168, 85, 247, 0.6) 100%)',
                    color: '#ffffff',
                    border: '2px solid rgba(236, 72, 153, 0.5)',
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                    textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {loading ? '处理中...' : '[ 执行注册 ]'}
                </button>
              </form>
            )}

            {/* Footer Text - Vaporwave Style */}
            <div className="mt-6 text-center">
              <p className="text-xs font-bold" style={{
                fontFamily: 'monospace',
                color: '#f0abfc',
                textShadow: '0 0 8px rgba(236, 72, 153, 0.6)',
              }}>
                {'>'} 会话将在关闭标签页时过期 {'<'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations - Vaporwave Style */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }

        @keyframes floatUpDown {
          0% {
            transform: translateY(calc(100vh + 100px)) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          95% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(calc(-100px)) rotate(360deg);
            opacity: 0;
          }
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
