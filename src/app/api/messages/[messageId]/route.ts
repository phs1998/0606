import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUser, requireAuth } from '@/lib/auth/middleware'
import { validateMessageContent } from '@/lib/utils/validation'
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '@/lib/utils/response'

// 获取单条留言
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const { messageId } = params
    const currentUser = await getCurrentUser(request)

    // 获取留言
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        content,
        like_count,
        reply_count,
        is_pinned,
        created_at,
        updated_at,
        user:users!messages_user_id_fkey (
          id,
          username,
          avatar_url,
          registration_number
        )
      `)
      .eq('id', messageId)
      .eq('is_public', true)
      .single()

    if (messageError || !message) {
      return notFoundResponse('留言不存在')
    }

    // 获取所有回复
    const { data: replies } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        content,
        like_count,
        created_at,
        user:users!messages_user_id_fkey (
          id,
          username,
          avatar_url,
          registration_number
        )
      `)
      .eq('parent_message_id', messageId)
      .eq('is_public', true)
      .order('created_at', { ascending: true })

    // 检查是否已点赞
    let isLiked = false
    if (currentUser) {
      const { data: like } = await supabaseAdmin
        .from('message_likes')
        .select('id')
        .eq('user_id', currentUser.userId)
        .eq('message_id', messageId)
        .single()

      isLiked = !!like
    }

    return successResponse({
      message: {
        ...message,
        is_liked: isLiked,
        replies: replies || [],
      },
    })
  } catch (error) {
    console.error('获取留言错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

// 更新留言
export async function PUT(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const currentUser = await requireAuth(request)
    const { messageId } = params
    const body = await request.json()
    const { content } = body

    // 验证留言内容
    const contentValidation = validateMessageContent(content)
    if (!contentValidation.valid) {
      return errorResponse(contentValidation.error!, 'VALIDATION_ERROR', 400)
    }

    // 检查留言是否存在且属于当前用户
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id, user_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      return notFoundResponse('留言不存在')
    }

    if (message.user_id !== currentUser.userId) {
      return forbiddenResponse('无权修改此留言')
    }

    // 更新留言
    const { data: updatedMessage, error: updateError } = await supabaseAdmin
      .from('messages')
      .update({
        content: content.trim(),
      })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      console.error('更新留言错误:', updateError)
      return errorResponse('更新留言失败', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      message: updatedMessage,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('更新留言错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

// 删除留言
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const currentUser = await requireAuth(request)
    const { messageId } = params

    // 检查留言是否存在
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id, user_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      return notFoundResponse('留言不存在')
    }

    // 检查权限（管理员可以删除任何留言，普通用户只能删除自己的）
    // 注意：这里需要从数据库获取用户的is_admin字段，简化处理
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', currentUser.userId)
      .single()

    if (message.user_id !== currentUser.userId && !user?.is_admin) {
      return forbiddenResponse('无权删除此留言')
    }

    // 删除留言
    const { error: deleteError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      console.error('删除留言错误:', deleteError)
      return errorResponse('删除留言失败', 'DATABASE_ERROR', 500)
    }

    return successResponse(null, '删除成功')
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('删除留言错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

