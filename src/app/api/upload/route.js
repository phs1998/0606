import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

const MAX_FILE_SIZE_AVATAR = 5 * 1024 * 1024 // 5MB (increased for better quality)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request) {
  try {
    const currentUser = await requireAuth(request)
    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type')

    if (!file) { return errorResponse('请选择要上传的文件', 'VALIDATION_ERROR', 400) }
    if (!type) { return errorResponse('请指定上传类型（avatar）', 'VALIDATION_ERROR', 400) }
    if (type !== 'avatar') { return errorResponse('类型必须是 avatar', 'VALIDATION_ERROR', 400) }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) { return errorResponse('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式', 'VALIDATION_ERROR', 400) }

    const maxSize = MAX_FILE_SIZE_AVATAR
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024
      return errorResponse(`头像文件大小不能超过 ${maxSizeMB}MB`, 'VALIDATION_ERROR', 400)
    }

    const bucketName = 'avatars'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${currentUser.userId}/${Date.now()}.${fileExt}`
    const filePath = fileName

    try {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
      if (!listError) {
        const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
        if (!bucketExists) {
          const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: maxSize,
            allowedMimeTypes: ALLOWED_MIME_TYPES,
          })
          if (createError) { console.warn(`创建 ${bucketName} bucket 失败（可能已存在或权限不足）:`, createError) }
          else { console.log(`成功创建 ${bucketName} bucket`) }
        }
      }
    } catch (error) { console.warn(`检查/创建 ${bucketName} bucket 时出错，继续尝试上传:`, error) }

    // Upload with optimized settings for better quality
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, { 
        contentType: file.type, 
        upsert: false, 
        cacheControl: '31536000', // 1 year cache for better performance
        // Don't compress - keep original quality
      })

    if (uploadError) {
      console.error('上传文件错误:', uploadError)
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
        return errorResponse(`存储桶 ${bucketName} 不存在，请先在 Supabase Dashboard 中创建该存储桶`, 'STORAGE_ERROR', 500)
      }
      return errorResponse('上传文件失败，请稍后重试', 'UPLOAD_ERROR', 500)
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    return successResponse({ url: publicUrl, type, fileName: filePath, size: file.size, mimeType: file.type })
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') { return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401) }
    console.error('上传文件错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}





