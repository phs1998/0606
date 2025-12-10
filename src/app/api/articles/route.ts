import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth, getCurrentUser } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'
import { extractMentions } from '@/lib/utils/mentions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: articles, error: articlesError } = await query

    if (articlesError) {
      console.error('获取文章错误:', articlesError)
      return errorResponse('获取文章失败', 'DATABASE_ERROR', 500)
    }

    // Get like status for current user (if authenticated)
    let likedArticleIds: string[] = []
    const currentUser = await getCurrentUser(request)
    if (currentUser) {
      const articleIds = (articles || []).map((a: any) => a.id)
      if (articleIds.length > 0) {
        const { data: likes } = await supabaseAdmin
          .from('article_likes')
          .select('article_id')
          .eq('user_id', currentUser.userId)
          .in('article_id', articleIds)

        likedArticleIds = (likes || []).map((l: any) => l.article_id)
      }
    }

    // Format response
    const formattedArticles = (articles || []).map((article: any) => ({
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
      is_liked: likedArticleIds.includes(article.id),
      created_at: article.created_at,
      updated_at: article.updated_at,
    }))

    return successResponse({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        has_more: (articles || []).length === limit,
      },
    })
  } catch (error: any) {
    console.error('获取文章错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const body = await request.json()
    const { title, content } = body

    // Validate
    if (!title || title.trim().length === 0) {
      return errorResponse('文章标题不能为空', 'VALIDATION_ERROR', 400)
    }

    if (title.length > 200) {
      return errorResponse('文章标题不能超过200个字符', 'VALIDATION_ERROR', 400)
    }

    if (!content || content.trim().length === 0) {
      return errorResponse('文章内容不能为空', 'VALIDATION_ERROR', 400)
    }

    // 检查文章字数：至少300字
    const contentLength = content.trim().length
    if (contentLength < 300) {
      return errorResponse('文章内容至少需要300字，当前字数：' + contentLength, 'VALIDATION_ERROR', 400)
    }

    if (content.length > 1500) {
      return errorResponse('文章内容不能超过1500个字符', 'VALIDATION_ERROR', 400)
    }

    // 检查一周内发布文章数量限制（最多3篇）
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { count: weeklyArticleCount, error: countError } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())

    if (countError) {
      console.error('查询一周内文章数量错误:', countError)
      return errorResponse('检查发布限制失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    if ((weeklyArticleCount || 0) >= 3) {
      return errorResponse('您本周已发布3篇文章，已达到每周发布上限，请下周再试', 'LIMIT_EXCEEDED', 429)
    }

    // Create article
    const { data: newArticle, error: articleError } = await supabaseAdmin
      .from('articles')
      .insert({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        like_count: 0,
        comment_count: 0,
      })
      .select('id, title, content, created_at')
      .single()

    if (articleError) {
      console.error('创建文章错误:', articleError)
      return errorResponse('发布失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    // Add experience points (+10 for posting article)
    try {
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('exp')
        .eq('id', userId)
        .single()

      const currentExp = currentUser?.exp || 0
      const oldLevel = Math.floor(currentExp / 100) + 1
      
      await supabaseAdmin
        .from('users')
        .update({ exp: currentExp + 10 })
        .eq('id', userId)

      // 检测是否升级
      const newExp = currentExp + 10
      const newLevel = Math.floor(newExp / 100) + 1
      
      if (newLevel > oldLevel) {
        // 创建升级通知
        await supabaseAdmin
          .from('mentions')
          .insert({
            user_id: userId,
            from_user_id: userId, // 系统消息，使用用户自己作为发送者
            post_id: null,
            comment_id: null,
            article_id: null,
            notification_type: 'level_up',
            content: `恭喜你升到了${newLevel}级！`,
            is_read: false,
          })
      }
    } catch (expError) {
      console.error('增加经验值错误:', expError)
      // Don't fail the article creation if exp update fails
    }

    // Extract mentions and create notifications
    const mentionedUsernames = extractMentions(content)
    if (mentionedUsernames.length > 0) {
      try {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, username')
          .in('username', mentionedUsernames)

        if (users && users.length > 0) {
          const mentionsToCreate = users
            .filter((u: any) => u.id !== userId)
            .map((user: any) => ({
              user_id: user.id,
              from_user_id: userId,
              post_id: null,
              comment_id: null,
              content: content.trim(),
              is_read: false,
            }))

          if (mentionsToCreate.length > 0) {
            await supabaseAdmin
              .from('mentions')
              .insert(mentionsToCreate)
          }
        }
      } catch (mentionError) {
        console.error('创建@通知失败:', mentionError)
      }
    }

    return successResponse({
      article: newArticle,
      message: '发布成功',
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('创建文章错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}


