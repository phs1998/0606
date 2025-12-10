import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'
import { extractMentions } from '@/lib/utils/mentions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('article_id')

    if (!articleId) {
      return errorResponse('缺少article_id参数', 'VALIDATION_ERROR', 400)
    }

    // Get comments (including replies)
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('article_comments')
      .select('id, content, user_id, article_id, parent_comment_id, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('获取评论错误:', commentsError)
      return errorResponse('获取评论失败', 'DATABASE_ERROR', 500)
    }

    // Get user info for all comments
    const userIds = [...new Set((comments || []).map((c: any) => c.user_id).filter(Boolean))]
    let usersMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url, registration_number, exp, equipped_avatar_frame_id, unlocked_name_color_id')
        .in('id', userIds)

      if (usersError) {
        console.error('获取用户信息错误:', usersError)
      } else {
        usersMap = (users || []).reduce((acc: any, user: any) => {
          acc[user.id] = user
          return acc
        }, {})
      }
    }

    // Format response and build nested structure
    const allComments = (comments || []).map((comment: any) => {
      const user = usersMap[comment.user_id]
      return {
        id: comment.id,
        content: comment.content,
        article_id: comment.article_id,
        parent_comment_id: comment.parent_comment_id || null,
        user: user ? {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          registration_number: user.registration_number,
          exp: user.exp || 0,
          equipped_avatar_frame_id: user.equipped_avatar_frame_id,
          unlocked_name_color_id: user.unlocked_name_color_id,
        } : null,
        created_at: comment.created_at,
        replies: [] as any[],
      }
    })

    // Build nested structure
    const topLevelComments = allComments.filter((c: any) => !c.parent_comment_id)
    const repliesMap = new Map<string, any[]>()
    
    allComments.forEach((comment: any) => {
      if (comment.parent_comment_id) {
        if (!repliesMap.has(comment.parent_comment_id)) {
          repliesMap.set(comment.parent_comment_id, [])
        }
        repliesMap.get(comment.parent_comment_id)!.push(comment)
      }
    })

    const attachReplies = (comment: any): any => {
      const replies = repliesMap.get(comment.id) || []
      return {
        ...comment,
        replies: replies.map(attachReplies),
      }
    }

    const formattedComments = topLevelComments.map(attachReplies)

    return successResponse({
      comments: formattedComments,
    })
  } catch (error: any) {
    console.error('获取评论错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const body = await request.json()
    const { article_id, content, parent_comment_id } = body

    // Validate
    if (!article_id) {
      return errorResponse('缺少article_id参数', 'VALIDATION_ERROR', 400)
    }

    if (!content || content.trim().length === 0) {
      return errorResponse('评论内容不能为空', 'VALIDATION_ERROR', 400)
    }

    if (content.length > 500) {
      return errorResponse('评论内容不能超过500个字符', 'VALIDATION_ERROR', 400)
    }

    // If replying to a comment, verify the parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('article_comments')
        .select('id, article_id')
        .eq('id', parent_comment_id)
        .single()

      if (parentError || !parentComment) {
        return errorResponse('父评论不存在', 'VALIDATION_ERROR', 400)
      }

      if (parentComment.article_id !== article_id) {
        return errorResponse('父评论不属于该文章', 'VALIDATION_ERROR', 400)
      }
    }

    // Create comment
    const { data: newComment, error: commentError } = await supabaseAdmin
      .from('article_comments')
      .insert({
        user_id: userId,
        article_id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select('id, content, parent_comment_id, created_at')
      .single()

    if (commentError) {
      console.error('创建评论错误:', commentError)
      return errorResponse('发布评论失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    // Increment comment count
    const { data: currentArticle } = await supabaseAdmin
      .from('articles')
      .select('comment_count, user_id')
      .eq('id', article_id)
      .single()

    const currentCount = currentArticle?.comment_count || 0

    await supabaseAdmin
      .from('articles')
      .update({ comment_count: currentCount + 1 })
      .eq('id', article_id)

    // Create notification for article author (if not commenting on own article)
    if (currentArticle && currentArticle.user_id !== userId) {
      try {
        await supabaseAdmin
          .from('mentions')
          .insert({
            user_id: currentArticle.user_id,
            from_user_id: userId,
            article_id: article_id,
            comment_id: newComment.id,
            content: content.trim(),
            notification_type: 'article_reply',
            is_read: false,
          })
      } catch (notifError) {
        console.error('创建文章回复通知失败:', notifError)
      }
    }

    // Create notification for parent comment author (if replying to a comment)
    if (parent_comment_id) {
      try {
        const { data: parentComment } = await supabaseAdmin
          .from('article_comments')
          .select('user_id')
          .eq('id', parent_comment_id)
          .single()

        if (parentComment && parentComment.user_id !== userId) {
          await supabaseAdmin
            .from('mentions')
            .insert({
              user_id: parentComment.user_id,
              from_user_id: userId,
              article_id: article_id,
              comment_id: newComment.id,
              content: content.trim(),
              notification_type: 'comment_reply',
              is_read: false,
            })
        }
      } catch (notifError) {
        console.error('创建评论回复通知失败:', notifError)
      }
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
              article_id: article_id,
              comment_id: newComment.id,
              content: content.trim(),
              notification_type: 'mention',
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
      comment: newComment,
      message: '评论成功',
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('创建评论错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}


















