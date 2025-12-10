import { supabaseAdmin } from './supabase/server'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB for post images

/**
 * 上传图片到Supabase Storage
 * @param {File} file - 要上传的文件
 * @param {string} bucketName - 存储桶名称
 * @param {string} userId - 用户ID
 * @returns {Promise<{url: string, path: string}>} 返回公开URL和文件路径
 */
export async function uploadImage(file, bucketName, userId) {
  // 验证文件类型
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式')
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // 生成唯一文件名
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = fileName

  // 读取文件为Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 检查并创建存储桶（如果不存在）
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (!listError) {
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
      if (!bucketExists) {
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
        })
        if (createError) {
          console.warn(`创建 ${bucketName} bucket 失败（可能已存在或权限不足）:`, createError)
        } else {
          console.log(`成功创建 ${bucketName} bucket`)
        }
      }
    }
  } catch (error) {
    console.warn(`检查/创建 ${bucketName} bucket 时出错，继续尝试上传:`, error)
  }

  // 上传文件
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('上传文件错误:', uploadError)
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
      throw new Error(`存储桶 ${bucketName} 不存在，请先在 Supabase Dashboard 中创建该存储桶`)
    }
    throw new Error('上传文件失败，请稍后重试')
  }

  // 获取公开URL
  const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  return {
    url: publicUrl,
    path: filePath,
  }
}

/**
 * 上传帖子图片
 * @param {File} file - 要上传的文件
 * @param {string} userId - 用户ID
 * @returns {Promise<string>} 返回图片的公开URL
 */
export async function uploadPostImage(file, userId) {
  const result = await uploadImage(file, 'post-images', userId)
  return result.url
}

















