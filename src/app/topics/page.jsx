'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthHeaders } from '@/lib/auth/client'
import PostCard from '@/components/topics/PostCard'
import ArticleCard from '@/components/topics/ArticleCard'
import UserProfileModal from '@/components/topics/UserProfileModal'
import PostDetailModal from '@/components/topics/PostDetailModal'
import AvatarWithFrame from '@/components/AvatarWithFrame'

const MAX_CONTENT_LENGTH = 150
const MAX_IMAGES = 3

const EMOJIS = [
  '😀', '😂', '😊', '😍', '😎', '😋', '😘', '🥰',
  '❤️', '💕', '💖', '💗', '👍', '👎', '👏', '🙌',
  '😮', '😱', '😢', '😭', '🤔', '🤗', '🤣', '😴',
  '🎉', '🎊', '🔥', '⭐', '🌟', '💯', '✨', '💪'
]

export default function TopicsPage() {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  // Post creation state
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modal states
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)

  const observerRef = useRef()
  const lastPostElementRef = useCallback((node) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts()
      }
    })
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore])

  const loadPosts = async (pageNum = 1, append = false) => {
    if (loading) return
    setLoading(true)
    setError('')

    try {
      // Load both posts and articles
      const [postsResponse, articlesResponse] = await Promise.all([
        fetch(`/api/posts?page=${pageNum}&limit=20`, {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/articles?page=${pageNum}&limit=20`, {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        }),
      ])

      const postsData = await postsResponse.json()
      const articlesData = await articlesResponse.json()

      if (postsResponse.ok && postsData.success) {
        if (append) {
          setPosts((prev) => [...prev, ...postsData.data.posts])
        } else {
          setPosts(postsData.data.posts)
        }
        setHasMore(postsData.data.pagination.has_more)
        setPage(pageNum)
      } else {
        setError(postsData.error || '加载失败')
      }

      if (articlesResponse.ok && articlesData.success) {
        if (append) {
          setArticles((prev) => [...prev, ...articlesData.data.articles])
        } else {
          setArticles(articlesData.data.articles)
        }
      }
    } catch (err) {
      console.error('加载内容错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, true)
    }
  }

  useEffect(() => {
    loadPosts(1, false)
  }, [])

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = MAX_IMAGES - images.length
    const filesToAdd = files.slice(0, remainingSlots)

    if (filesToAdd.length === 0) return

    // Create previews
    const newPreviews = []
    filesToAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push({ file, preview: e.target.result })
        if (newPreviews.length === filesToAdd.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews])
          setImages((prev) => [...prev, ...filesToAdd])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setError('请先登录')
      return
    }

    if (!content.trim() && images.length === 0) {
      setError('请输入内容或上传图片')
      return
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`内容不能超过${MAX_CONTENT_LENGTH}个字符`)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('content', content.trim())
      images.forEach((image) => {
        formData.append('images', image)
      })

      const token = sessionStorage.getItem('token')
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Reset form
        setContent('')
        setImages([])
        setImagePreviews([])
        // Reload posts
        loadPosts(1, false)
      } else {
        setError(data.error || '发布失败')
      }
    } catch (err) {
      console.error('发布错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      setError('请先登录')
      return
    }

    try {
      const token = sessionStorage.getItem('token')
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update post in state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                is_liked: data.data.liked,
                like_count: data.data.liked
                  ? post.like_count + 1
                  : Math.max(0, post.like_count - 1),
              }
            }
            return post
          })
        )
      }
    } catch (err) {
      console.error('点赞错误:', err)
    }
  }

  const handleCommentAdded = (postId) => {
    // Update comment count in the post
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comment_count: (post.comment_count || 0) + 1,
          }
        }
        return post
      })
    )
    // Update comment count in modal if open
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1,
      }))
    }
  }

  const handleUserClick = (userId) => {
    setSelectedUserId(userId)
  }

  const handlePostClick = (post) => {
    setSelectedPost(post)
  }

  const insertEmoji = (emoji) => {
    setContent((prev) => prev + emoji)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">话题</h1>

        {/* Post Creation Area */}
        {isAuthenticated && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <form onSubmit={handleSubmit}>
              {/* Text Input */}
              <div className="mb-4">
                {/* Emoji Buttons */}
                <div className="mb-2 pb-2 border-b border-gray-200">
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {EMOJIS.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
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
                  placeholder="分享你的想法..."
                  rows={4}
                  maxLength={MAX_CONTENT_LENGTH}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span
                    className={`text-sm ${
                      content.length > MAX_CONTENT_LENGTH * 0.9
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {content.length}/{MAX_CONTENT_LENGTH}
                  </span>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={images.length >= MAX_IMAGES}
                />
                <label
                  htmlFor="image-upload"
                  className={`inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    images.length >= MAX_IMAGES
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  📷 添加图片 ({images.length}/{MAX_IMAGES})
                </label>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {imagePreviews.map((item, index) => (
                      <div key={index} className="relative">
                        <img
                          src={item.preview}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || (!content.trim() && images.length === 0)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '发布中...' : '发布'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        {error && !loading && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Combine articles and posts, sorted by created_at */}
          {[...articles.map(a => ({ ...a, type: 'article' })), ...posts.map(p => ({ ...p, type: 'post' }))]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((item, index, allItems) => (
              <div
                key={`${item.type}-${item.id}`}
                ref={index === allItems.length - 1 ? lastPostElementRef : null}
              >
                {item.type === 'article' ? (
                  <ArticleCard
                    article={item}
                    onUserClick={handleUserClick}
                  />
                ) : (
                  <PostCard
                    post={item}
                    onLike={handleLike}
                    onCommentAdded={handleCommentAdded}
                    currentUserId={user?.id}
                    onUserClick={handleUserClick}
                    onPostClick={handlePostClick}
                  />
                )}
              </div>
            ))}
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        )}

        {!hasMore && (posts.length > 0 || articles.length > 0) && (
          <div className="text-center py-8 text-gray-500">没有更多了</div>
        )}

        {!loading && posts.length === 0 && articles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            还没有内容，快来发布第一条吧！
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentUserId={user?.id}
          onLike={handleLike}
          onCommentAdded={handleCommentAdded}
          onUserClick={handleUserClick}
        />
      )}
    </div>
  )
}

