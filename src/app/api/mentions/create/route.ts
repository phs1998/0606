import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const fromUserId = currentUser.userId

    const body = await request.json()
    const { content, post_id, comment_id, mentioned_usernames } = body

    if (!content || !mentioned_usernames || !Array.isArray(mentioned_usernames) || mentioned_usernames.length === 0) {
      return errorResponse('缺少必要参数', 'VALIDATION_ERROR', 400)
    }

    // Get user IDs for mentioned usernames
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .in('username', mentioned_usernames)

    if (usersError) {
      console.error('查找用户失败:', usersError)
      return errorResponse('查找用户失败', 'DATABASE_ERROR', 500)
    }

    if (!users || users.length === 0) {
      return successResponse({
        message: '没有找到被@的用户',
        created: 0,
      })
    }

    // Create mentions for each mentioned user (excluding self)
    const mentionsToCreate = users
      .filter((u: any) => u.id !== fromUserId)
      .map((user: any) => ({
        user_id: user.id,
        from_user_id: fromUserId,
        post_id: post_id || null,
        comment_id: comment_id || null,
        content: content,
        is_read: false,
      }))

    if (mentionsToCreate.length === 0) {
      return successResponse({
        message: '没有需要创建的通知',
        created: 0,
      })
    }

    const { data: createdMentions, error: createError } = await supabaseAdmin
      .from('mentions')
      .insert(mentionsToCreate)
      .select('id')

    if (createError) {
      console.error('创建通知失败:', createError)
      return errorResponse('创建通知失败', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      message: '通知创建成功',
      created: createdMentions?.length || 0,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('创建通知错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}




















