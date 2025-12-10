'use client'

import { useState } from 'react'
import AvatarWithFrame from '@/components/AvatarWithFrame'
import ArticleDetailModal from '@/components/articles/ArticleDetailModal'

export default function ArticleCard({ article, onUserClick }) {
  const [showDetail, setShowDetail] = useState(false)

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

  return (
    <>
      <div 
        className="vapor-glass vapor-article-card vapor-article-card-border rounded-xl p-6 cursor-pointer relative overflow-hidden"
        onClick={() => setShowDetail(true)}
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-4">
          {article.user?.id && (
            <div className="flex-shrink-0 cursor-pointer" onClick={(e) => {
              e.stopPropagation()
              onUserClick && onUserClick(article.user.id)
            }}>
              <AvatarWithFrame userId={article.user.id} size="md" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {article.user && (
                <>
                  <span
                    className="font-semibold vapor-gradient-text-pink-cyan cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUserClick && onUserClick(article.user.id)
                    }}
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {article.user.username}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--vapor-cyan)' }}>
                    #{article.user.registration_number}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--vapor-purple)' }}>
                    LV.{Math.floor((article.user.exp || 0) / 100) + 1}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2">
              <span className="vapor-digital-clock">
                {formatTime(article.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Article Title - VHS故障效果 */}
        <h2 className="text-xl font-bold mb-3 vapor-vhs-title" style={{ 
          color: 'var(--vapor-pink)',
          textShadow: '0 0 10px var(--vapor-pink)',
          fontFamily: 'monospace',
          letterSpacing: '1px',
        }}>
          {article.title}
        </h2>

        {/* Article Content Preview - 复古终端样式 */}
        <p className="vapor-terminal-text-cyan whitespace-pre-wrap mb-3 line-clamp-3">
          {article.content.length > 150 
            ? `${article.content.substring(0, 150)}...` 
            : article.content}
        </p>

        {/* Interaction Bar */}
        <div className="flex items-center gap-6 pt-4 border-t" style={{ 
          borderColor: 'var(--vapor-cyan)',
          opacity: 0.5,
        }}>
          <button 
            className="flex items-center gap-2 transition-colors"
            style={{ color: 'var(--vapor-pink)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xl">{article.is_liked ? '❤️' : '🤍'}</span>
            <span className="text-sm font-bold" style={{ 
              textShadow: '0 0 5px var(--vapor-pink)',
            }}>{article.like_count || 0}</span>
          </button>
          <div className="flex items-center gap-2" style={{ color: 'var(--vapor-cyan)' }}>
            <span className="text-xl">💬</span>
            <span className="text-sm font-bold" style={{ 
              textShadow: '0 0 5px var(--vapor-cyan)',
            }}>{article.comment_count || 0}</span>
          </div>
        </div>
      </div>

      {showDetail && (
        <ArticleDetailModal
          articleId={article.id}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}



