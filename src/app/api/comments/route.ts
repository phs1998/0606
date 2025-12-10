import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'
import { extractMentions } from '@/lib/utils/mentions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')

    if (!postId) {
      return errorResponse('缺少post_id参数', 'VALIDATION_ERROR', 400)
    }

    // Get comments (including replies)
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('id, content, user_id, post_id, parent_comment_id, created_at')
      .eq('post_id', postId)
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
        post_id: comment.post_id,
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

    // Build nested structure: separate top-level comments and replies
    const topLevelComments = allComments.filter((c: any) => !c.parent_comment_id)
    const repliesMap = new Map<string, any[]>()
    
    // Group replies by parent comment ID
    allComments.forEach((comment: any) => {
      if (comment.parent_comment_id) {
        if (!repliesMap.has(comment.parent_comment_id)) {
          repliesMap.set(comment.parent_comment_id, [])
        }
        repliesMap.get(comment.parent_comment_id)!.push(comment)
      }
    })

    // Attach replies to their parent comments
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
    const { post_id, content, parent_comment_id } = body

    // Validate
    if (!post_id) {
      return errorResponse('缺少post_id参数', 'VALIDATION_ERROR', 400)
    }

    if (!content || content.trim().length === 0) {
      return errorResponse('评论内容不能为空', 'VALIDATION_ERROR', 400)
    }

    if (content.length > 500) {
      return errorResponse('评论内容不能超过500个字符', 'VALIDATION_ERROR', 400)
    }

    // If replying to a comment, verify the parent comment exists and belongs to the same post
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('comments')
        .select('id, post_id')
        .eq('id', parent_comment_id)
        .single()

      if (parentError || !parentComment) {
        return errorResponse('父评论不存在', 'VALIDATION_ERROR', 400)
      }

      if (parentComment.post_id !== post_id) {
        return errorResponse('父评论不属于该帖子', 'VALIDATION_ERROR', 400)
      }
    }

    // Create comment
    const { data: newComment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: userId,
        post_id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select('id, content, parent_comment_id, created_at')
      .single()

    if (commentError) {
      console.error('创建评论错误:', commentError)
      return errorResponse('发布评论失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    // Add experience points (+5 for commenting)
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
        .update({ exp: currentExp + 5 })
        .eq('id', userId)

      // 检测是否升级
      const newExp = currentExp + 5
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
      // Don't fail the comment creation if exp update fails
    }

    // Increment comment count
    const { data: currentPost } = await supabaseAdmin
      .from('posts')
      .select('comment_count')
      .eq('id', post_id)
      .single()

    const currentCount = currentPost?.comment_count || 0

    await supabaseAdmin
      .from('posts')
      .update({ comment_count: currentCount + 1 })
      .eq('id', post_id)

    // Create notification for post author (if not commenting on own post)
    try {
      const { data: postData } = await supabaseAdmin
        .from('posts')
        .select('user_id')
        .eq('id', post_id)
        .single()

      if (postData && postData.user_id !== userId) {
        await supabaseAdmin
          .from('mentions')
          .insert({
            user_id: postData.user_id,
            from_user_id: userId,
            post_id: post_id,
            comment_id: newComment.id,
            content: content.trim(),
            notification_type: 'post_reply',
            is_read: false,
          })
      }
    } catch (notifError) {
      console.error('创建回复通知失败:', notifError)
    }

    // Create notification for parent comment author (if replying to a comment)
    if (parent_comment_id) {
      try {
        const { data: parentComment } = await supabaseAdmin
          .from('comments')
          .select('user_id')
          .eq('id', parent_comment_id)
          .single()

        if (parentComment && parentComment.user_id !== userId) {
          await supabaseAdmin
            .from('mentions')
            .insert({
              user_id: parentComment.user_id,
              from_user_id: userId,
              post_id: post_id,
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
        // Get user IDs for mentioned usernames
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, username')
          .in('username', mentionedUsernames)

        if (users && users.length > 0) {
          // Create mentions for each mentioned user (excluding self)
          const mentionsToCreate = users
            .filter((u: any) => u.id !== userId)
            .map((user: any) => ({
              user_id: user.id,
              from_user_id: userId,
              post_id: post_id,
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
        // Don't fail the comment creation if mention creation fails
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

