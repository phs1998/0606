import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId
    const { postId } = params

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    // Get current like count
    const { data: currentPost } = await supabaseAdmin
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single()

    const currentCount = currentPost?.like_count || 0

    if (existingLike) {
      // Unlike: remove like and decrement count
      await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      await supabaseAdmin
        .from('posts')
        .update({ like_count: Math.max(0, currentCount - 1) })
        .eq('id', postId)

      return successResponse({ liked: false, message: '取消点赞成功' })
    } else {
      // Like: add like and increment count
      await supabaseAdmin
        .from('post_likes')
        .insert({
          user_id: userId,
          post_id: postId,
        })

      await supabaseAdmin
        .from('posts')
        .update({ like_count: currentCount + 1 })
        .eq('id', postId)

      return successResponse({ liked: true, message: '点赞成功' })
    }
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('点赞错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

