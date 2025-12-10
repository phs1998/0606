import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params

    // Get article with user info
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select(`
        id,
        title,
        content,
        user_id,
        like_count,
        comment_count,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          avatar_url,
          registration_number,
          exp,
          equipped_avatar_frame_id,
          unlocked_name_color_id
        )
      `)
      .eq('id', articleId)
      .single()

    if (articleError || !article) {
      return errorResponse('文章不存在', 'NOT_FOUND', 404)
    }

    // Get like status for current user (if authenticated)
    let isLiked = false
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      if (token) {
        // Verify token and get user ID
        const { data: user } = await supabaseAdmin.auth.getUser(token)
        if (user?.user) {
          const { data: like } = await supabaseAdmin
            .from('article_likes')
            .select('id')
            .eq('user_id', user.user.id)
            .eq('article_id', articleId)
            .single()

          isLiked = !!like
        }
      }
    } catch (error) {
      // User not authenticated, continue without like status
    }

    return successResponse({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        user: article.users?.[0] ? {
          id: article.users[0].id,
          username: article.users[0].username,
          avatar_url: article.users[0].avatar_url,
          registration_number: article.users[0].registration_number,
          exp: article.users[0].exp || 0,
          equipped_avatar_frame_id: article.users[0].equipped_avatar_frame_id,
          unlocked_name_color_id: article.users[0].unlocked_name_color_id,
        } : null,
        like_count: article.like_count || 0,
        comment_count: article.comment_count || 0,
        is_liked: isLiked,
        created_at: article.created_at,
        updated_at: article.updated_at,
      },
    })
  } catch (error: any) {
    console.error('获取文章错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}












