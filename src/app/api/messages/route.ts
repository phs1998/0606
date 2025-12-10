import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUser, requireAuth } from '@/lib/auth/middleware'
import { validateMessageContent } from '@/lib/utils/validation'
import { successResponse, errorResponse } from '@/lib/utils/response'

// 获取留言列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const sort = searchParams.get('sort') || 'newest'
    const userId = searchParams.get('user_id')
    const currentUser = await getCurrentUser(request)

    const offset = (page - 1) * limit

    // 构建查询
    let query = supabaseAdmin
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
      .eq('is_public', true)

    // 筛选特定用户的留言
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // 排序
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'popular') {
      query = query.order('like_count', { ascending: false })
    } else {
      // newest (默认)
      query = query.order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
    }

    // 分页
    query = query.range(offset, offset + limit - 1)

    const { data: messages, error: messagesError, count } = await query

    if (messagesError) {
      console.error('获取留言列表错误:', messagesError)
      return errorResponse('获取留言列表失败', 'DATABASE_ERROR', 500)
    }

    // 如果用户已登录，检查每条留言是否已点赞
    let likedMessageIds: string[] = []
    if (currentUser) {
      const messageIds = messages?.map(m => m.id) || []
      if (messageIds.length > 0) {
        const { data: likes } = await supabaseAdmin
          .from('message_likes')
          .select('message_id')
          .eq('user_id', currentUser.userId)
          .in('message_id', messageIds)

        likedMessageIds = likes?.map(l => l.message_id) || []
      }
    }

    // 获取每条留言的回复（只获取前3条）
    const messagesWithReplies = await Promise.all(
      (messages || []).map(async (message) => {
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
          .eq('parent_message_id', message.id)
          .eq('is_public', true)
          .order('created_at', { ascending: true })
          .limit(3)

        return {
          ...message,
          is_liked: currentUser ? likedMessageIds.includes(message.id) : false,
          replies: replies || [],
        }
      })
    )

    // 获取总数
    let countQuery = supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true)

    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    const { count: totalCount } = await countQuery

    return successResponse({
      messages: messagesWithReplies,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        total_pages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取留言列表错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

// 创建新留言
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const body = await request.json()
    const { content, is_public = true, parent_message_id } = body

    // 验证留言内容
    const contentValidation = validateMessageContent(content)
    if (!contentValidation.valid) {
      return errorResponse(contentValidation.error!, 'VALIDATION_ERROR', 400)
    }

    // 如果是回复，验证父留言是否存在
    if (parent_message_id) {
      const { data: parentMessage } = await supabaseAdmin
        .from('messages')
        .select('id')
        .eq('id', parent_message_id)
        .single()

      if (!parentMessage) {
        return errorResponse('父留言不存在', 'PARENT_NOT_FOUND', 404)
      }
    }

    // 创建留言
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: currentUser.userId,
        content: content.trim(),
        is_public: is_public,
        parent_message_id: parent_message_id || null,
      })
      .select(`
        id,
        content,
        user_id,
        like_count,
        reply_count,
        created_at
      `)
      .single()

    if (insertError) {
      console.error('创建留言错误:', insertError)
      return errorResponse('创建留言失败', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      message: newMessage,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('创建留言错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

