import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get mentions for the user
    const { data: mentions, error: mentionsError } = await supabaseAdmin
      .from('mentions')
      .select(`
        id,
        from_user_id,
        post_id,
        comment_id,
        article_id,
        notification_type,
        content,
        is_read,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (mentionsError) {
      console.error('获取通知失败:', mentionsError)
      return errorResponse('获取通知失败', 'DATABASE_ERROR', 500)
    }

    // Get user information for from_user_id
    const fromUserIds = [...new Set((mentions || [])
      .map((m: any) => m.from_user_id)
      .filter((id: string) => id))]

    let fromUsersMap: Record<string, any> = {}
    if (fromUserIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url, registration_number')
        .in('id', fromUserIds)

      if (!usersError && users) {
        fromUsersMap = users.reduce((acc: Record<string, any>, user: any) => {
          acc[user.id] = {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            registration_number: user.registration_number,
          }
          return acc
        }, {})
      }
    }

    // Format response
    const formattedMentions = (mentions || []).map((mention: any) => ({
      id: mention.id,
      from_user: mention.from_user_id ? (fromUsersMap[mention.from_user_id] || null) : null,
      post_id: mention.post_id,
      comment_id: mention.comment_id,
      article_id: mention.article_id,
      notification_type: mention.notification_type || 'mention',
      content: mention.content,
      is_read: mention.is_read,
      created_at: mention.created_at,
    }))

    return successResponse({
      mentions: formattedMentions,
      total: formattedMentions.length,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取通知错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const body = await request.json()
    const { mention_id, mark_all_read } = body

    if (mark_all_read) {
      // Mark all mentions as read
      const { error } = await supabaseAdmin
        .from('mentions')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('标记所有通知为已读失败:', error)
        return errorResponse('标记失败', 'DATABASE_ERROR', 500)
      }

      return successResponse({
        message: '已标记所有通知为已读',
      })
    } else if (mention_id) {
      // Mark single mention as read
      const { error } = await supabaseAdmin
        .from('mentions')
        .update({ is_read: true })
        .eq('id', mention_id)
        .eq('user_id', userId)

      if (error) {
        console.error('标记通知为已读失败:', error)
        return errorResponse('标记失败', 'DATABASE_ERROR', 500)
      }

      return successResponse({
        message: '已标记为已读',
      })
    } else {
      return errorResponse('缺少参数', 'VALIDATION_ERROR', 400)
    }
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('标记通知错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

