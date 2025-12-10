'use client'

import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/auth/client'
import ArticleDetailModal from './ArticleDetailModal'

interface Article {
  id: string
  title: string
  created_at: string
}

interface ArticleListProps {
  userId?: string
}

export default function ArticleList({ userId }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)

  useEffect(() => {
    loadArticles()
  }, [userId])

  const loadArticles = async () => {
    setLoading(true)
    try {
      const url = userId 
        ? `/api/articles?user_id=${userId}&limit=4`
        : '/api/articles?limit=4'
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store', // Fresh data, but limit is small (4 articles) so it's fast
      })

      const data = await response.json()
      if (response.ok && data.success) {
        // Limit to 4 articles, newest first (API already returns sorted by created_at DESC)
        const articlesList = data.data.articles || []
        setArticles(articlesList.slice(0, 4))
      }
    } catch (err) {
      console.error('加载文章列表错误:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 86400000) return '今天'
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {loading ? (
        <div className="text-center py-4 text-sm" style={{ 
          color: 'var(--vapor-cyan)',
          fontFamily: 'monospace',
          textShadow: '0 0 5px var(--vapor-cyan)',
        }}>
          加载中...
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ 
          color: 'var(--vapor-pink)',
          fontFamily: 'monospace',
          textShadow: '0 0 5px var(--vapor-pink)',
        }}>
          文章待创建
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article.id)}
              className="w-full text-left p-3 rounded-lg vapor-glass vapor-article-card vapor-article-card-border transition-all"
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div className="font-medium text-sm mb-2 vapor-vhs-title" style={{
                color: 'var(--vapor-pink)',
                fontFamily: 'monospace',
                textShadow: '0 0 5px var(--vapor-pink)',
              }}>
                {article.title.length > 30 
                  ? `${article.title.substring(0, 30)}...` 
                  : article.title}
              </div>
              <div className="vapor-digital-clock">
                {formatTime(article.created_at)}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedArticle && (
        <ArticleDetailModal
          articleId={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </>
  )
}

