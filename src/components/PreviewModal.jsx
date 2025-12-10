'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function PreviewModal({ isOpen, onClose, previewData }) {
  const { user } = useAuth()

  if (!isOpen) { return null }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) { onClose() }
  }

  const renderAvatarFramePreview = () => {
    const { item } = previewData
    const imageUrl = item.image_url || item.icon_url

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 text-center">头像框预览</h3>
        
        <div className="flex justify-center p-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="max-w-full h-auto rounded-lg border-2 border-gray-200"
              style={{
                maxWidth: '300px',
                maxHeight: '300px',
                objectFit: 'contain',
                imageRendering: 'crisp-edges',
                WebkitImageRendering: '-webkit-optimize-contrast',
                msImageRendering: 'crisp-edges',
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex'
                }
              }}
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              无图片
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-800">{item.name}</p>
          {item.description && ( <p className="text-sm text-gray-600">{item.description}</p> )}
          {item.rarity && ( <p className="text-xs text-gray-500">稀有度：{item.rarity}</p> )}
        </div>
      </div>
    )
  }


  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="关闭">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mt-2">
            {previewData?.type === 'avatar_frame' && renderAvatarFramePreview()}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">关闭</button>
          </div>
        </div>
      </div>
    </>
  )
}






