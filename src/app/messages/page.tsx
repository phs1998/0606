'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import PostDetailModal from '@/components/topics/PostDetailModal'
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
  const [selectedPost, setSelectedPost] = useState<any>(null)
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
      // Fetch post data and open modal
      try {
        const response = await fetch(`/api/posts?post_id=${mention.post_id}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        })
        const data = await response.json()
        if (response.ok && data.success && data.data.posts && data.data.posts.length > 0) {
          setSelectedPost(data.data.posts[0])
        } else {
          // Fallback to navigation
          router.push(`/topics?post=${mention.post_id}`)
        }
      } catch (err) {
        console.error('加载帖子错误:', err)
        // Fallback to navigation
        router.push(`/topics?post=${mention.post_id}`)
      }
    }
  }

  const handleLike = async (postId: string) => {
    // This will be handled by PostDetailModal
  }

  const handleCommentAdded = (postId: string) => {
    // Reload mentions to show new notifications
    loadMentions()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const unreadCount = mentions.filter((m) => !m.is_read).length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-6">
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
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentUserId={user?.id}
          onLike={handleLike}
          onCommentAdded={handleCommentAdded}
        />
      )}

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

