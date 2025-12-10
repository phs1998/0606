'use client'

import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth/client'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import Link from 'next/link'

interface PostDetailModalProps {
  post: any
  onClose: () => void
  currentUserId?: string
  onLike?: (postId: string) => void
  onCommentAdded?: (postId: string) => void
  onUserClick?: (userId: string) => void
}

export default function PostDetailModal({
  post,
  onClose,
  currentUserId,
  onLike,
  onCommentAdded,
  onUserClick,
}: PostDetailModalProps) {
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // Comment ID being replied to
  const [replyContent, setReplyContent] = useState<Record<string, string>>({}) // Reply content for each comment

  const formatTime = (timestamp: string | number | Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return date.toLocaleDateString('zh-CN')
  }

  useEffect(() => {
    if (post?.id) {
      // Reset state when post changes
      setComments([])
      setLoadingComments(true)
      loadComments()
    } else {
      setComments([])
      setLoadingComments(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id])

  const loadComments = async () => {
    if (!post?.id) {
      setComments([])
      setLoadingComments(false)
      setCommentError(null)
      return
    }
    setLoadingComments(true)
    setComments([])
    setCommentError(null)
    try {
      // Comments API doesn't require auth, but we'll include headers if available
      const headers = getAuthHeaders()
      const response = await fetch(`/api/comments?post_id=${encodeURIComponent(post.id)}`, {
        headers: headers,
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        const commentsList = data.data?.comments || []
        setComments(commentsList)
        setCommentError(null)
      } else {
        const errorMsg = data.error || '未知错误'
        console.error('加载评论失败:', errorMsg)
        setCommentError(errorMsg)
        setComments([])
      }
    } catch (err) {
      console.error('加载评论错误:', err)
      setCommentError(err instanceof Error ? err.message : '加载评论失败，请稍后重试')
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (parentCommentId?: string | null) => {
    if (!currentUserId || !post?.id) {
      alert('请先登录')
      return
    }

    const content = parentCommentId ? replyContent[parentCommentId] : commentContent
    if (!content || !content.trim()) {
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
          parent_comment_id: parentCommentId || null,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        if (parentCommentId) {
          // Clear reply content
          setReplyContent((prev) => {
            const newContent = { ...prev }
            delete newContent[parentCommentId]
            return newContent
          })
          setReplyingTo(null)
        } else {
          setCommentContent('')
        }
        await loadComments()
        if (onCommentAdded) {
          onCommentAdded(post.id)
        }
      } else {
        alert(data.error || '评论失败')
      }
    } catch (err) {
      console.error('评论错误:', err)
      alert('网络错误，请稍后重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  const insertEmoji = (emoji: string, parentCommentId?: string | null) => {
    if (parentCommentId) {
      setReplyContent((prev) => ({
        ...prev,
        [parentCommentId]: (prev[parentCommentId] || '') + emoji,
      }))
    } else {
      setCommentContent((prev) => prev + emoji)
    }
  }

  // Calculate total comment count including replies
  const getTotalCommentCount = (commentsList: any[]): number => {
    return commentsList.reduce((total, comment) => {
      return total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0)
    }, 0)
  }

  // Render a single comment with its replies
  const renderComment = (comment: any, depth: number = 0) => {
    const isReplying = replyingTo === comment.id
    const replyText = replyContent[comment.id] || ''

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-3 border-l-2 border-gray-200 pl-3' : ''}>
        <div className="flex gap-3">
          {comment.user?.id && (
            <div
              className="flex-shrink-0 cursor-pointer"
              onClick={() => onUserClick && onUserClick(comment.user.id)}
            >
              <AvatarWithFrame userId={comment.user.id} size="sm" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {comment.user && (
                <>
                  <span
                    className="font-semibold text-sm text-gray-800 hover:text-indigo-600 cursor-pointer"
                    onClick={() => onUserClick && onUserClick(comment.user.id)}
                  >
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(comment.created_at)}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            
            {/* Reply Button */}
            {currentUserId && (
              <button
                onClick={() => {
                  setReplyingTo(isReplying ? null : comment.id)
                  if (!isReplying) {
                    setReplyContent((prev) => ({
                      ...prev,
                      [comment.id]: '',
                    }))
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 mb-2"
              >
                {isReplying ? '取消回复' : '回复'}
              </button>
            )}

            {/* Reply Input */}
            {isReplying && currentUserId && (
              <div className="mt-2 mb-3">
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto pb-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji, comment.id)}
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
                    value={replyText}
                    onChange={(e) =>
                      setReplyContent((prev) => ({
                        ...prev,
                        [comment.id]: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitComment(comment.id)
                      }
                    }}
                    placeholder={`回复 ${comment.user?.username || '用户'}...`}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={submittingComment || !replyText.trim()}
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? '发送中...' : '发送'}
                  </button>
                </div>
              </div>
            )}

            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const emojis = [
    '😀', '😂', '😊', '😍', '😎', '😋', '😘', '🥰',
    '❤️', '💕', '💖', '💗', '👍', '👎', '👏', '🙌',
    '😮', '😱', '😢', '😭', '🤔', '🤗', '🤣', '😴',
    '🎉', '🎊', '🔥', '⭐', '🌟', '💯', '✨', '💪'
  ]

  if (!post) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            lineHeight: '1',
          }}
        >
          ×
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Author Info */}
          <div className="flex items-start gap-3 mb-4">
            {post.user?.id && (
              <div
                className="flex-shrink-0 cursor-pointer"
                onClick={() => onUserClick && onUserClick(post.user.id)}
              >
                <AvatarWithFrame userId={post.user.id} size="md" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {post.user && (
                  <>
                    <span
                      className="font-semibold hover:text-indigo-600 transition-colors cursor-pointer"
                      onClick={() => onUserClick && onUserClick(post.user.id)}
                    >
                      {post.user.username}
                    </span>
                    <span className="text-sm text-indigo-600">
                      #{post.user.registration_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      LV.{Math.floor((post.user.exp || 0) / 100) + 1}
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
            <p className="text-gray-800 whitespace-pre-wrap mb-3 text-lg">{post.content}</p>

            {/* Images */}
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="relative">
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
                          {post.image_urls.map((_: string, index: number) => (
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
            )}
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-200 mb-4">
            <button
              onClick={() => onLike && onLike(post.id)}
              className={`flex items-center gap-2 transition-colors ${
                post.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <span className="text-xl">{post.is_liked ? '❤️' : '🤍'}</span>
              <span className="text-sm">{post.like_count || 0}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-xl">💬</span>
              <span className="text-sm">{post.comment_count || 0}</span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold mb-4">
              评论 ({getTotalCommentCount(comments)})
            </h3>

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
                        handleSubmitComment()
                      }
                    }}
                    placeholder="写评论..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSubmitComment()}
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
            ) : commentError ? (
              <div className="text-center py-4 text-red-500 text-sm">
                {commentError}
                <button
                  onClick={loadComments}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 underline"
                >
                  重试
                </button>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">暂无评论</div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => renderComment(comment, 0))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

