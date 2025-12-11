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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(/flashcenter.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Semi-transparent Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(250, 245, 240, 0.3)',
        }}
      />


      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Auth Card - White Background */}
          <div
            className="relative p-8"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >

            {/* Title */}
            <h1 
              className="text-2xl font-bold mb-2"
              style={{
                color: '#000000',
                fontFamily: 'sans-serif',
              }}
            >
              Agent Login
            </h1>
            
            {/* Subtitle */}
            <p 
              className="text-sm mb-6"
              style={{
                color: '#9CA3AF',
                fontFamily: 'sans-serif',
                fontWeight: 'normal',
              }}
            >
              Hey, Enter your details...
            </p>

            {/* Tab Switching */}
            <div className="flex gap-2 mb-6" style={{
              borderBottom: '1px solid #E5E7EB',
            }}>
              <button
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                }}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  isLogin
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={{
                  fontFamily: 'sans-serif',
                  borderBottom: isLogin ? '2px solid #000000' : 'none',
                }}
              >
                登录
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                }}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  !isLogin
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={{
                  fontFamily: 'sans-serif',
                  borderBottom: !isLogin ? '2px solid #000000' : 'none',
                }}
              >
                注册
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-3 text-sm rounded"
                style={{
                  fontFamily: 'sans-serif',
                  border: '1px solid #FCA5A5',
                  background: '#FEE2E2',
                  color: '#DC2626',
                }}
              >
                错误: {error}
              </div>
            )}

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{
                    fontFamily: 'sans-serif',
                    color: '#6B7280',
                  }}>
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm transition-all rounded-lg"
                    style={{
                      fontFamily: 'sans-serif',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      outline: 'none',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F9C784'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 199, 132, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{
                    fontFamily: 'sans-serif',
                    color: '#6B7280',
                  }}>
                    密码
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm transition-all rounded-lg"
                    style={{
                      fontFamily: 'sans-serif',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      outline: 'none',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F9C784'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 199, 132, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.boxShadow = 'none'
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
                    className="w-4 h-4 mr-2"
                    style={{
                      accentColor: '#F9C784',
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="rememberPassword"
                    className="text-xs cursor-pointer"
                    style={{
                      fontFamily: 'sans-serif',
                      color: '#6B7280',
                      fontWeight: 'normal',
                    }}
                  >
                    记住密码
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 font-medium text-sm transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'sans-serif',
                    background: '#F9C784',
                    color: '#FFFFFF',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#F5B869'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#F9C784'
                    }
                  }}
                >
                  {loading ? '处理中...' : '登录'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{
                    fontFamily: 'sans-serif',
                    color: '#6B7280',
                  }}>
                    用户名 (最多15个字符)
                  </label>
                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    maxLength={15}
                    className="w-full px-4 py-2.5 text-sm transition-all rounded-lg"
                    style={{
                      fontFamily: 'sans-serif',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      outline: 'none',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F9C784'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 199, 132, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{
                    fontFamily: 'sans-serif',
                    color: '#6B7280',
                  }}>
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm transition-all rounded-lg"
                    style={{
                      fontFamily: 'sans-serif',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      outline: 'none',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F9C784'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 199, 132, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{
                    fontFamily: 'sans-serif',
                    color: '#6B7280',
                  }}>
                    密码 (最少8个字符)
                  </label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 text-sm transition-all rounded-lg"
                    style={{
                      fontFamily: 'sans-serif',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      outline: 'none',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F9C784'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 199, 132, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 font-medium text-sm transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'sans-serif',
                    background: '#F9C784',
                    color: '#FFFFFF',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#F5B869'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#F9C784'
                    }
                  }}
                >
                  {loading ? '处理中...' : '注册'}
                </button>
              </form>
            )}

            {/* Footer Text */}
            <div className="mt-6 text-center">
              <p className="text-xs" style={{
                fontFamily: 'sans-serif',
                color: '#9CA3AF',
                fontWeight: 'normal',
              }}>
                会话将在关闭标签页时过期
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
