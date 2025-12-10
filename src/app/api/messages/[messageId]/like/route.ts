import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response'

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const currentUser = await requireAuth(request)
    const { messageId } = params

    // 检查留言是否存在
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .single()

    if (!message) {
      return notFoundResponse('留言不存在')
    }

    // 检查是否已点赞
    const { data: existingLike } = await supabaseAdmin
      .from('message_likes')
      .select('id')
      .eq('user_id', currentUser.userId)
      .eq('message_id', messageId)
      .single()

    if (existingLike) {
      // 取消点赞
      const { error: deleteError } = await supabaseAdmin
        .from('message_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('取消点赞错误:', deleteError)
        return errorResponse('操作失败', 'DATABASE_ERROR', 500)
      }

      // 获取更新后的点赞数
      const { data: updatedMessage } = await supabaseAdmin
        .from('messages')
        .select('like_count')
        .eq('id', messageId)
        .single()

      return successResponse({
        is_liked: false,
        like_count: updatedMessage?.like_count || 0,
      })
    } else {
      // 添加点赞
      const { error: insertError } = await supabaseAdmin
        .from('message_likes')
        .insert({
          user_id: currentUser.userId,
          message_id: messageId,
        })

      if (insertError) {
        console.error('点赞错误:', insertError)
        return errorResponse('操作失败', 'DATABASE_ERROR', 500)
      }

      // 获取更新后的点赞数
      const { data: updatedMessage } = await supabaseAdmin
        .from('messages')
        .select('like_count')
        .eq('id', messageId)
        .single()

      return successResponse({
        is_liked: true,
        like_count: updatedMessage?.like_count || 0,
      })
    }
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('点赞操作错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

