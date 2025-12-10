'use client'

import { useState, useEffect } from 'react'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import { getAuthHeaders } from '@/lib/auth/client'

export default function PostCard({ post, onLike, onCommentAdded, currentUserId, onUserClick, onPostClick }) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [userColor, setUserColor] = useState(null)

  const calculateLevel = (exp) => {
    return Math.floor((exp || 0) / 100) + 1
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return date.toLocaleDateString('zh-CN')
  }

  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments])

  useEffect(() => {
    // Load user color if needed
    if (post.user?.unlocked_name_color_id) {
      loadUserColor()
    }
  }, [post.user?.id, post.user?.unlocked_name_color_id])

  const loadUserColor = async () => {
    try {
      // Try to get color from user profile API
      // For now, we'll fetch the user's profile to get color info
      // In a real app, this might be included in the post data
      const response = await fetch(`/api/user/profile`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        // Check if this is the current user or we need to fetch the post author's profile
        // For simplicity, we'll check if the post user has a color ID and try to find it
        if (post.user?.unlocked_name_color_id && data.data.allColors) {
          const color = data.data.allColors.find(
            (c) => c.id === post.user.unlocked_name_color_id
          )
          if (color) {
            setUserColor(color)
          }
        }
      }
    } catch (err) {
      console.error('加载用户颜色错误:', err)
    }
  }

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/comments?post_id=${post.id}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setComments(data.data.comments || [])
      }
    } catch (err) {
      console.error('加载评论错误:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (content) => {
    if (!currentUserId) {
      alert('请先登录')
      return
    }

    if (!content.trim()) {
      return
    }

    setSubmittingComment(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          post_id: post.id,
          content: content.trim(),
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setCommentContent('')
        await loadComments()
        // Update comment count in parent component
        if (onCommentAdded) {
          onCommentAdded(post.id)
        }
      } else {
        const errorMsg = data.error || '评论失败'
        console.error('评论失败:', errorMsg, data)
        alert(errorMsg)
      }
    } catch (err) {
      console.error('评论错误:', err)
      alert('网络错误，请稍后重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  const insertEmoji = (emoji) => {
    setCommentContent((prev) => prev + emoji)
  }

  const emojis = [
    '😀', '😂', '😊', '😍', '😎', '😋', '😘', '🥰',
    '❤️', '💕', '💖', '💗', '👍', '👎', '👏', '🙌',
    '😮', '😱', '😢', '😭', '🤔', '🤗', '🤣', '😴',
    '🎉', '🎊', '🔥', '⭐', '🌟', '💯', '✨', '💪'
  ]

  const useRainbowText = userColor?.name === '梦幻彩虹'

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
      onClick={(e) => {
        // Don't trigger if clicking on interactive elements
        if (
          e.target.closest('button') ||
          e.target.closest('a') ||
          e.target.closest('input') ||
          e.target.closest('textarea')
        ) {
          return
        }
        if (onPostClick) {
          onPostClick(post)
        }
      }}
    >
      {/* Author Info */}
      <div className="flex items-start gap-3 mb-4">
        {post.user?.id && (
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              if (onUserClick) {
                onUserClick(post.user.id)
              }
            }}
          >
            <AvatarWithFrame userId={post.user.id} size="md" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {post.user && (
              <>
                <span
                  className={`font-semibold hover:text-indigo-600 transition-colors cursor-pointer ${
                    useRainbowText ? 'rainbow-text' : ''
                  }`}
                  style={
                    !useRainbowText && userColor
                      ? { color: userColor.color_code }
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (onUserClick) {
                      onUserClick(post.user.id)
                    }
                  }}
                >
                  {post.user.username}
                </span>
                <span className="text-sm text-indigo-600">
                  #{post.user.registration_number}
                </span>
                <span className="text-xs text-gray-500">
                  LV.{calculateLevel(post.user.exp)}
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatTime(post.created_at)}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Images */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="relative">
            <div className="grid grid-cols-1 gap-2">
              {post.image_urls.length === 1 ? (
                <img
                  src={post.image_urls[0]}
                  alt="Post image"
                  className="w-full rounded-lg object-cover max-h-96"
                />
              ) : (
                <div className="relative">
                  <img
                    src={post.image_urls[currentImageIndex]}
                    alt={`Post image ${currentImageIndex + 1}`}
                    className="w-full rounded-lg object-cover max-h-96"
                  />
                  {post.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) =>
                              (prev - 1 + post.image_urls.length) %
                              post.image_urls.length
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) => (prev + 1) % post.image_urls.length
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                      >
                        ›
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {post.image_urls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => onLike && onLike(post.id)}
          className={`flex items-center gap-2 transition-colors ${
            post.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <span className="text-xl">{post.is_liked ? '❤️' : '🤍'}</span>
          <span className="text-sm">{post.like_count || 0}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <span className="text-xl">💬</span>
          <span className="text-sm">{post.comment_count || 0}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
          <span className="text-xl">🔄</span>
          <span className="text-sm">转发</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Comment Input */}
          {currentUserId && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto pb-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 active:scale-110"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitComment(commentContent)
                    }
                  }}
                  placeholder="写评论..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleSubmitComment(commentContent)}
                  disabled={submittingComment || !commentContent.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-4 text-gray-500 text-sm">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">暂无评论</div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.user?.id && (
                    <div
                      className="flex-shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (onUserClick) {
                          onUserClick(comment.user.id)
                        }
                      }}
                    >
                      <AvatarWithFrame userId={comment.user.id} size="sm" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {comment.user && (
                        <>
                          <span
                            className="font-semibold text-sm text-gray-800 hover:text-indigo-600 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (onUserClick) {
                                onUserClick(comment.user.id)
                              }
                            }}
                          >
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(comment.created_at)}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

