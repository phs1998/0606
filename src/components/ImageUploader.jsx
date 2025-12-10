'use client'

import { useState, useRef, useCallback } from 'react'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export default function ImageUploader({ onUploadComplete, maxSize = 5 * 1024 * 1024, type = 'avatar', disabled = false }) {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: '请选择文件' }
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式' }
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024
      return { valid: false, error: `文件大小不能超过 ${maxSizeMB}MB` }
    }

    return { valid: true }
  }

  const handleFileChange = (file) => {
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      setError('')
    }
    reader.readAsDataURL(file)

    // Auto upload
    handleUpload(file)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) {
      setError('上传功能已禁用。')
      return
    }

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }, [maxSize, type, onUploadComplete, disabled])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleUpload = useCallback(async (file) => {
    if (disabled) {
      setError('上传功能已禁用。')
      return
    }
    setError('')
    setUploading(true)
    setUploadProgress(0)

    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error)
      setUploading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const token = sessionStorage.getItem('token')
      if (!token) {
        setError('未登录，请先登录')
        setUploading(false)
        return
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload', true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.withCredentials = true

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        setUploading(false)
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          if (result.success) {
            setPreview(result.data.url)
            onUploadComplete(result.data.url)
          } else {
            setError(result.error || '上传失败')
          }
        } else {
          const errorResult = JSON.parse(xhr.responseText)
          setError(errorResult.error || `上传失败: ${xhr.statusText}`)
        }
      }

      xhr.onerror = () => {
        setUploading(false)
        setError('网络错误，请检查您的网络连接')
      }

      xhr.send(formData)
    } catch (err) {
      console.error('上传错误:', err)
      setError('上传失败，请稍后重试')
      setUploading(false)
    }
  }, [maxSize, type, onUploadComplete, disabled])

  const handleClearPreview = () => {
    setPreview(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors relative ${
        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
        accept={ALLOWED_MIME_TYPES.join(',')}
        disabled={disabled}
      />

      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-indigo-600 font-medium">上传中... {uploadProgress}%</p>
        </div>
      ) : preview ? (
        <div className="relative group">
          <img src={preview} alt="预览" className="max-w-full h-auto max-h-48 mx-auto rounded-lg object-contain" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClearPreview()
            }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="清除预览"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className={`text-gray-500 ${disabled ? 'opacity-60' : ''}`}>
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-1 text-sm">
            {disabled ? '已达本月修改上限' : '拖放图片到此处，或点击选择文件'}
          </p>
          <p className="text-xs text-gray-400">
            （最大 {maxSize / 1024 / 1024}MB，支持 JPG, PNG, GIF, WebP）
          </p>
        </div>
      )}
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  )
}

