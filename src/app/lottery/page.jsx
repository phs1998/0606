'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

export default function LotteryPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [hasDrawnToday, setHasDrawnToday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Clock animation refs
  const hourHandRef = useRef(null)
  const minuteHandRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    checkDrawStatus()
    startClockAnimation()
  }, [isAuthenticated])

  const checkDrawStatus = async () => {
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
    } finally {
      setLoading(false)
    }
  }

  const startClockAnimation = () => {
    const updateClock = () => {
      const now = new Date()
      const hours = now.getHours() % 12
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()

      const hourAngle = (hours * 30 + minutes * 0.5) // 每小时30度，每分钟0.5度
      const minuteAngle = minutes * 6 + seconds * 0.1 // 每分钟6度，每秒0.1度

      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `rotate(${hourAngle}deg)`
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `rotate(${minuteAngle}deg)`
      }
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }

  const handleDraw = async () => {
    if (hasDrawnToday || drawing) return

    setDrawing(true)
    setError('')

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
        setResult(data.data)
        setHasDrawnToday(true)
        setShowResult(true)
      } else {
        const errorMessage = data.error || '抽奖失败'
        console.error('抽奖API错误:', {
          status: response.status,
          data: data,
          error: errorMessage,
        })
        setError(errorMessage)
        if (data.code === 'ALREADY_DRAWN_TODAY') {
          setHasDrawnToday(true)
        }
      }
    } catch (err) {
      console.error('抽奖错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setDrawing(false)
    }
  }

  const getRewardInfo = (rewardType) => {
    const rewards = {
      S: { name: 'S级奖励', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '⭐' },
      A: { name: 'A级奖励', color: 'text-red-600', bgColor: 'bg-red-100', icon: '💎' },
      B: { name: 'B级奖励', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '✨' },
      NONE: { name: '未中奖', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '😢' },
    }
    return rewards[rewardType] || rewards.NONE
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
            每日抽奖
          </h1>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            {/* Clock and Button Section */}
            <div className="flex flex-col items-center">
              {/* Clock */}
              <div className="relative w-64 h-64 mb-8">
                <svg
                  className="w-full h-full transform rotate-[-90deg]"
                  viewBox="0 0 200 200"
                >
                  {/* Clock face */}
                  <circle
                    cx="100"
                    cy="100"
                    r="95"
                    fill="white"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>

                  {/* Hour marks */}
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour, index) => {
                    const angle = (index * 30 - 90) * (Math.PI / 180)
                    const x1 = 100 + 80 * Math.cos(angle)
                    const y1 = 100 + 80 * Math.sin(angle)
                    const x2 = 100 + 90 * Math.cos(angle)
                    const y2 = 100 + 90 * Math.sin(angle)
                    return (
                      <line
                        key={hour}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#6366F1"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    )
                  })}

                  {/* Center circle */}
                  <circle cx="100" cy="100" r="8" fill="#6366F1" />

                  {/* Hour hand */}
                  <line
                    ref={hourHandRef}
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="60"
                    stroke="#8B5CF6"
                    strokeWidth="6"
                    strokeLinecap="round"
                    style={{ transformOrigin: '100px 100px', transition: 'transform 0.3s ease' }}
                  />

                  {/* Minute hand */}
                  <line
                    ref={minuteHandRef}
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="40"
                    stroke="#EC4899"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{ transformOrigin: '100px 100px', transition: 'transform 0.3s ease' }}
                  />
                </svg>
              </div>

              {/* Draw Button */}
              <button
                onClick={handleDraw}
                disabled={hasDrawnToday || drawing}
                className={`px-12 py-4 text-xl font-bold rounded-2xl shadow-2xl transition-all transform ${
                  hasDrawnToday
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : drawing
                    ? 'bg-indigo-500 text-white scale-95'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:scale-105 active:scale-95'
                }`}
              >
                {drawing ? '抽奖中...' : hasDrawnToday ? '今日已抽' : '立即抽奖'}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">奖池预览</h2>

              {/* Reward Examples */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-purple-100 rounded-lg">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <div className="font-semibold text-purple-800">S级奖励</div>
                    <div className="text-sm text-purple-600">稀有头像框</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-red-100 rounded-lg">
                  <span className="text-3xl">💎</span>
                  <div>
                    <div className="font-semibold text-red-800">A级奖励</div>
                    <div className="text-sm text-red-600">高级昵称颜色</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-blue-100 rounded-lg">
                  <span className="text-3xl">✨</span>
                  <div>
                    <div className="font-semibold text-blue-800">B级奖励</div>
                    <div className="text-sm text-blue-600">普通昵称颜色</div>
                  </div>
                </div>
              </div>

              {/* Probability Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">概率说明</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-600 font-medium">S级</span>
                    <span className="text-gray-600">1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 font-medium">A级</span>
                    <span className="text-gray-600">5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">B级</span>
                    <span className="text-gray-600">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">未中奖</span>
                    <span className="text-gray-600">84%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && result && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowResult(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowResult(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {result.is_win ? (
              <div className="text-center">
                <div className="mb-6 animate-pulse">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="text-3xl font-bold text-green-600 mb-2">恭喜中奖！</div>
                </div>

                <div className={`p-6 rounded-xl mb-6 ${getRewardInfo(result.reward_type).bgColor}`}>
                  <div className="text-5xl mb-4">{getRewardInfo(result.reward_type).icon}</div>
                  <div className={`text-2xl font-bold mb-2 ${getRewardInfo(result.reward_type).color}`}>
                    {getRewardInfo(result.reward_type).name}
                  </div>
                  {result.reward_name && (
                    <div className="text-lg text-gray-700">{result.reward_name}</div>
                  )}
                </div>

                <button
                  onClick={() => setShowResult(false)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  确定
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4">😢</div>
                  <div className="text-2xl font-bold text-gray-700 mb-2">
                    很遗憾，下次好运！
                  </div>
                  <div className="text-gray-500">
                    明天再来试试吧
                  </div>
                </div>

                <button
                  onClick={() => setShowResult(false)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  确定
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .animate-pulse {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

