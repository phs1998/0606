'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import ArticleDetailModal from '@/components/articles/ArticleDetailModal'

interface Mention {
  id: string
  from_user: {
    id: string
    username: string
    avatar_url?: string | null
    registration_number: number
  } | null
  post_id?: string | null
  comment_id?: string | null
  article_id?: string | null
  notification_type?: string
  content: string
  is_read: boolean
  created_at: string
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [mentions, setMentions] = useState<Mention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      loadMentions()
    }
  }, [user, authLoading, router])

  const loadMentions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mentions', {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMentions(data.data.mentions || [])
      } else {
        setError(data.error || '加载通知失败')
      }
    } catch (err) {
      console.error('加载通知错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (mentionId: string) => {
    try {
      const response = await fetch('/api/mentions', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ mention_id: mentionId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMentions((prev) =>
          prev.map((m) => (m.id === mentionId ? { ...m, is_read: true } : m))
        )
        // Refresh unread count in navbar
        window.dispatchEvent(new Event('mentions-updated'))
      }
    } catch (err) {
      console.error('标记已读错误:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/mentions', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ mark_all_read: true }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMentions((prev) => prev.map((m) => ({ ...m, is_read: true })))
        // Refresh unread count in navbar
        window.dispatchEvent(new Event('mentions-updated'))
      }
    } catch (err) {
      console.error('标记全部已读错误:', err)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const handleMentionClick = async (mention: Mention) => {
    if (!mention.is_read) {
      markAsRead(mention.id)
    }

    // 升级消息不需要打开任何内容，只标记为已读
    if (mention.notification_type === 'level_up') {
      return
    }

    // Open modal based on notification type
    if (mention.notification_type === 'article_reply' && mention.article_id) {
      setSelectedArticle(mention.article_id)
    } else if ((mention.notification_type === 'post_reply' || mention.notification_type === 'comment_reply' || mention.notification_type === 'mention') && mention.post_id) {
      // Topics page removed, just mark as read
      console.log('Post notification clicked, but topics page is removed')
    }
  }

  const handleCommentAdded = () => {
    // Reload mentions to show new notifications
    loadMentions()
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const unreadCount = mentions.filter((m) => !m.is_read).length

  return (
    <div style={{ padding: '24px', paddingLeft: '32px', paddingRight: '32px' }}>
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: '#E6F3FF' }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">消息通知</h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                标记全部已读
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {mentions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无通知
            </div>
          ) : (
            <div className="space-y-3">
              {mentions.map((mention) => (
                <div
                  key={mention.id}
                  onClick={() => handleMentionClick(mention)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    mention.is_read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {mention.from_user?.id && mention.notification_type !== 'level_up' && (
                      <div className="flex-shrink-0">
                        <AvatarWithFrame userId={mention.from_user.id} size="md" />
                      </div>
                    )}
                    {mention.notification_type === 'level_up' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                        ⭐
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {mention.notification_type === 'level_up' ? (
                          <span className="font-semibold text-gray-800">系统通知</span>
                        ) : (
                          <>
                            <span className="font-semibold text-gray-800">
                              {mention.from_user?.username || '未知用户'}
                            </span>
                            <span className="text-sm text-indigo-600">
                              #{mention.from_user?.registration_number}
                            </span>
                          </>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatTime(mention.created_at)}
                        </span>
                        {!mention.is_read && (
                          <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {mention.notification_type === 'level_up' && '🎉 等级提升'}
                        {mention.notification_type === 'mention' && (mention.comment_id ? '在评论中' : mention.article_id ? '在文章中' : '在帖子中') + ' @了你'}
                        {mention.notification_type === 'post_reply' && '回复了你的帖子'}
                        {mention.notification_type === 'article_reply' && '回复了你的文章'}
                        {mention.notification_type === 'comment_reply' && '回复了你的评论'}
                      </p>
                      {mention.notification_type === 'level_up' ? (
                        <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 p-3 rounded border border-indigo-200">
                          {mention.content}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                          {mention.content.length > 100
                            ? `${mention.content.substring(0, 100)}...`
                            : mention.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Feedback Component */}
        <div 
          className="border border-slate-200 grid grid-cols-6 gap-2 rounded-xl p-2 text-sm"
          style={{ marginTop: '100px', backgroundColor: '#E6F3FF', width: '50%', marginLeft: 'auto', marginRight: 'auto' }}
        >
          <h1 className="text-center text-lg font-bold col-span-6" style={{ color: '#475569' }}>纸飞机</h1>

          <textarea 
            placeholder="说点什么呗" 
            className="bg-slate-100 text-slate-600 placeholder:text-slate-600 placeholder:opacity-50 border border-slate-200 col-span-6 resize-none outline-none rounded-lg p-2 duration-300 focus:border-slate-600"
            style={{ height: '56px' }}
          />

          <button 
            className="fill-slate-600 col-span-1 flex justify-center items-center rounded-lg p-2 duration-300 bg-slate-100 hover:border-slate-600 focus:fill-blue-200 focus:bg-blue-400 border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 512 512">
              <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm177.6 62.1C192.8 334.5 218.8 352 256 352s63.2-17.5 78.4-33.9c9-9.7 24.2-10.4 33.9-1.4s10.4 24.2 1.4 33.9c-22 23.8-60 49.4-113.6 49.4s-91.7-25.5-113.6-49.4c-9-9.7-8.4-24.9 1.4-33.9s24.9-8.4 33.9 1.4zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"></path>
            </svg>
          </button>

          <button 
            className="fill-slate-600 col-span-1 flex justify-center items-center rounded-lg p-2 duration-300 bg-slate-100 hover:border-slate-600 focus:fill-blue-200 focus:bg-blue-400 border border-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 512 512">
              <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM174.6 384.1c-4.5 12.5-18.2 18.9-30.7 14.4s-18.9-18.2-14.4-30.7C146.9 319.4 198.9 288 256 288s109.1 31.4 126.6 79.9c4.5 12.5-2 26.2-14.4 30.7s-26.2-2-30.7-14.4C328.2 358.5 297.2 336 256 336s-72.2 22.5-81.4 48.1zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"></path>
            </svg>
          </button>

          <span className="col-span-2"></span>

          <button 
            className="bg-slate-100 stroke-slate-600 border border-slate-200 col-span-2 flex justify-center rounded-lg p-2 duration-300 hover:border-slate-600 hover:text-white focus:stroke-blue-200 focus:bg-blue-400"
          >
            <svg fill="none" viewBox="0 0 24 24" height="30px" width="30px" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" d="M7.39999 6.32003L15.89 3.49003C19.7 2.22003 21.77 4.30003 20.51 8.11003L17.68 16.6C15.78 22.31 12.66 22.31 10.76 16.6L9.91999 14.08L7.39999 13.24C1.68999 11.34 1.68999 8.23003 7.39999 6.32003Z"></path>
              <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" d="M10.11 13.6501L13.69 10.0601"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          articleId={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  )
}

