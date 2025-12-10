'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

const MAX_TITLE_LENGTH = 200
const MAX_CONTENT_LENGTH = 1500
const MIN_CONTENT_LENGTH = 300 // 最少300字

const EMOJIS = [
  '😀', '😂', '😊', '😍', '😎', '😋', '😘', '🥰',
  '❤️', '💕', '💖', '💗', '👍', '👎', '👏', '🙌',
  '😮', '😱', '😢', '😭', '🤔', '🤗', '🤣', '😴',
  '🎉', '🎊', '🔥', '⭐', '🌟', '💯', '✨', '💪'
]

export default function CreatePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const insertEmoji = (emoji: string, field: 'title' | 'content') => {
    if (field === 'title') {
      setTitle((prev) => {
        const newTitle = prev + emoji
        return newTitle.length > MAX_TITLE_LENGTH ? prev : newTitle
      })
    } else {
      setContent((prev) => {
        const newContent = prev + emoji
        return newContent.length > MAX_CONTENT_LENGTH ? prev : newContent
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setError('请先登录')
      return
    }

    if (!title.trim()) {
      setError('请输入文章标题')
      return
    }

    if (!content.trim()) {
      setError('请输入文章内容')
      return
    }

    if (title.length > MAX_TITLE_LENGTH) {
      setError(`标题不能超过${MAX_TITLE_LENGTH}个字符`)
      return
    }

    // 检查文章字数：至少300字
    const contentLength = content.trim().length
    if (contentLength < MIN_CONTENT_LENGTH) {
      setError(`文章内容至少需要${MIN_CONTENT_LENGTH}字，当前字数：${contentLength}`)
      return
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`内容不能超过${MAX_CONTENT_LENGTH}个字符`)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Reset form
        setTitle('')
        setContent('')
        // Redirect to home page
        router.push('/home')
      } else {
        // 处理不同的错误类型
        if (response.status === 429) {
          setError(data.error || '您本周已发布3篇文章，已达到每周发布上限，请下周再试')
        } else {
          setError(data.error || '发布失败')
        }
      }
    } catch (err) {
      console.error('发布文章错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">请先登录</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">创作文章</h1>

          <form onSubmit={handleSubmit}>
            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章标题
              </label>
              {/* Emoji Buttons for Title */}
              <div className="mb-2 pb-2 border-b border-gray-200">
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji, 'title')}
                      className="text-lg hover:scale-125 transition-transform p-1.5 rounded hover:bg-gray-100 active:scale-110"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入文章标题..."
                maxLength={MAX_TITLE_LENGTH}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-2">
                <span
                  className={`text-sm ${
                    title.length > MAX_TITLE_LENGTH * 0.9
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
            </div>

            {/* Content Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章内容
              </label>
              {/* Emoji Buttons for Content */}
              <div className="mb-2 pb-2 border-b border-gray-200">
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji, 'content')}
                      className="text-lg hover:scale-125 transition-transform p-1.5 rounded hover:bg-gray-100 active:scale-110"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入文章内容..."
                rows={15}
                maxLength={MAX_CONTENT_LENGTH}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span
                  className={`text-sm ${
                    content.trim().length < MIN_CONTENT_LENGTH
                      ? 'text-red-600 font-medium'
                      : content.length > MAX_CONTENT_LENGTH * 0.9
                      ? 'text-orange-600'
                      : 'text-gray-500'
                  }`}
                >
                  {content.trim().length < MIN_CONTENT_LENGTH
                    ? `字数不足：${content.trim().length}/${MIN_CONTENT_LENGTH}（至少需要${MIN_CONTENT_LENGTH}字）`
                    : `${content.length}/${MAX_CONTENT_LENGTH}`}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim() || content.trim().length < MIN_CONTENT_LENGTH}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
