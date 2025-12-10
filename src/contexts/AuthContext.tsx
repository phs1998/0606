'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth/client'

interface User {
  id: string
  username: string
  email: string
  registration_number: number
  avatar_url?: string | null
  exp?: number
  equipped_avatar_frame_id?: string | null
  unlocked_name_color_id?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUser({
            id: data.data.id,
            username: data.data.username,
            email: data.data.email,
            registration_number: data.data.registration_number,
            avatar_url: data.data.avatar_url,
          })
        }
      } else {
        // Token无效，清除
        sessionStorage.removeItem('token')
      }
    } catch (error) {
      console.error('检查认证状态错误:', error)
      sessionStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    sessionStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
    } catch (error) {
      console.error('登出错误:', error)
    } finally {
      sessionStorage.removeItem('token')
      setUser(null)
      router.push('/')
    }
  }

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUser({
            id: data.data.id,
            username: data.data.username,
            email: data.data.email,
            registration_number: data.data.registration_number,
            avatar_url: data.data.avatar_url,
          })
        }
      }
    } catch (error) {
      console.error('刷新用户信息错误:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

