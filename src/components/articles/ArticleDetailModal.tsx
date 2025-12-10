'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import AvatarWithFrame from '@/components/AvatarWithFrame'

interface ArticleDetailModalProps {
  articleId: string
  onClose: () => void
}

interface Article {
  id: string
  title: string
  content: string
  user: {
    id: string
    username: string
    avatar_url?: string | null
    registration_number: number
    exp: number
    equipped_avatar_frame_id?: string | null
    unlocked_name_color_id?: string | null
  } | null
  like_count: number
  comment_count: number
  is_liked: boolean
  created_at: string
}

interface Comment {
  id: string
  content: string
  user: {
    id: string
    username: string
    avatar_url?: string | null
    registration_number: number
    exp: number
  } | null
  parent_comment_id?: string | null
  created_at: string
  replies?: Comment[]
}

export default function ArticleDetailModal({ articleId, onClose }: ArticleDetailModalProps) {
  const { user } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})

  useEffect(() => {
    loadArticle()
    loadComments()
  }, [articleId])

  const loadArticle = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setArticle(data.data.article)
      } else {
        setError(data.error || '加载文章失败')
      }
    } catch (err) {
      console.error('加载文章错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    if (!articleId) return
    setLoadingComments(true)
    setCommentError(null)
    try {
      const response = await fetch(`/api/article-comments?article_id=${encodeURIComponent(articleId)}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setComments(data.data.comments || [])
        setCommentError(null)
      } else {
        setCommentError(data.error || '加载评论失败')
        setComments([])
      }
    } catch (err) {
      console.error('加载评论错误:', err)
      setCommentError('网络错误，请稍后重试')
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (parentCommentId?: string | null) => {
    if (!user?.id || !articleId) {
      alert('请先登录')
      return
    }

    const content = parentCommentId ? replyContent[parentCommentId] : commentContent
    if (!content || !content.trim()) {
      return
    }

    setSubmittingComment(true)
    try {
      const response = await fetch('/api/article-comments', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          article_id: articleId,
          content: content.trim(),
          parent_comment_id: parentCommentId || null,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        if (parentCommentId) {
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
        await loadArticle() // Refresh comment count
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

  const getTotalCommentCount = (commentsList: Comment[]): number => {
    return commentsList.reduce((total, comment) => {
      return total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0)
    }, 0)
  }

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isReplying = replyingTo === comment.id
    const replyText = replyContent[comment.id] || ''

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-3 border-l-2 border-gray-200 pl-3' : ''}>
        <div className="flex gap-3">
          {comment.user?.id && (
            <div className="flex-shrink-0">
              <AvatarWithFrame userId={comment.user.id} size="sm" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {comment.user && (
                <>
                  <span className="font-semibold text-sm text-gray-800 hover:text-indigo-600 cursor-pointer">
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(comment.created_at)}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            
            {user && (
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

            {isReplying && user && (
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

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
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

  const emojis = [
    '😀', '😂', '😊', '😍', '😎', '😋', '😘', '🥰',
    '❤️', '💕', '💖', '💗', '👍', '👎', '👏', '🙌',
    '😮', '😱', '😢', '😭', '🤔', '🤗', '🤣', '😴',
    '🎉', '🎊', '🔥', '⭐', '🌟', '💯', '✨', '💪'
  ]

  if (!articleId) return null

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

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : article ? (
            <>
              {/* Author Info */}
              <div className="flex items-start gap-3 mb-4">
                {article.user?.id && (
                  <div className="flex-shrink-0">
                    <AvatarWithFrame userId={article.user.id} size="md" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {article.user && (
                      <>
                        <span className="font-semibold hover:text-indigo-600 transition-colors">
                          {article.user.username}
                        </span>
                        <span className="text-sm text-indigo-600">
                          #{article.user.registration_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          LV.{Math.floor((article.user.exp || 0) / 100) + 1}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTime(article.created_at)}
                  </div>
                </div>
              </div>

              {/* Article Title */}
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{article.title}</h1>

              {/* Article Content */}
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {article.content}
                </p>
              </div>

              {/* Interaction Bar */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-200 mb-4">
                <button className={`flex items-center gap-2 transition-colors ${
                  article.is_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                }`}>
                  <span className="text-xl">{article.is_liked ? '❤️' : '🤍'}</span>
                  <span className="text-sm">{article.like_count || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-xl">💬</span>
                  <span className="text-sm">{getTotalCommentCount(comments)}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold mb-4">
                  评论 ({getTotalCommentCount(comments)})
                </h3>

                {/* Comment Input */}
                {user && (
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
                    <button onClick={loadComments} className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">重试</button>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">暂无评论</div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => renderComment(comment, 0))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">文章不存在</div>
          )}
        </div>
      </div>
    </div>
  )
}

