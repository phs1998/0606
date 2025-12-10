import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth, getCurrentUser } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'
import { uploadPostImage } from '@/lib/upload'
import { extractMentions } from '@/lib/utils/mentions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('posts')
      .select(`
        id,
        content,
        image_urls,
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

    // If post_id is provided, get single post
    if (postId) {
      query = query.eq('id', postId).limit(1)
    } else {
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('获取帖子错误:', postsError)
      return errorResponse('获取帖子失败', 'DATABASE_ERROR', 500)
    }

    // Get like status for current user (if authenticated)
    let likedPostIds: string[] = []
    const currentUser = await getCurrentUser(request)
    if (currentUser) {
      const postIds = (posts || []).map((p: any) => p.id)
      if (postIds.length > 0) {
        const { data: likes } = await supabaseAdmin
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUser.userId)
          .in('post_id', postIds)

        likedPostIds = (likes || []).map((l: any) => l.post_id)
      }
    }

    // Format response
    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      content: post.content,
      image_urls: post.image_urls || [],
      user: post.users ? {
        id: post.users.id,
        username: post.users.username,
        avatar_url: post.users.avatar_url,
        registration_number: post.users.registration_number,
        exp: post.users.exp || 0,
        equipped_avatar_frame_id: post.users.equipped_avatar_frame_id,
        unlocked_name_color_id: post.users.unlocked_name_color_id,
      } : null,
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      is_liked: likedPostIds.includes(post.id),
      created_at: post.created_at,
      updated_at: post.updated_at,
    }))

    return successResponse({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        has_more: (posts || []).length === limit,
      },
    })
  } catch (error: any) {
    console.error('获取帖子错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const formData = await request.formData()
    const content = formData.get('content') as string
    const images = formData.getAll('images') as File[]

    // Validate content
    if (!content || content.trim().length === 0) {
      return errorResponse('帖子内容不能为空', 'VALIDATION_ERROR', 400)
    }

    if (content.length > 150) {
      return errorResponse('帖子内容不能超过150个字符', 'VALIDATION_ERROR', 400)
    }

    // Validate images
    if (images.length > 3) {
      return errorResponse('最多只能上传3张图片', 'VALIDATION_ERROR', 400)
    }

    // Upload images
    const imageUrls: string[] = []
    for (const image of images) {
      if (image && image.size > 0) {
        try {
          const url = await uploadPostImage(image, userId)
          imageUrls.push(url)
        } catch (error: any) {
          console.error('上传图片错误:', error)
          return errorResponse(error.message || '上传图片失败', 'UPLOAD_ERROR', 500)
        }
      }
    }

    // Create post
    const { data: newPost, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        like_count: 0,
        comment_count: 0,
      })
      .select('id, content, image_urls, created_at')
      .single()

    if (postError) {
      console.error('创建帖子错误:', postError)
      return errorResponse('发布失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    // Add experience points (+10 for posting)
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
      // Don't fail the post creation if exp update fails
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
              post_id: newPost.id,
              comment_id: null,
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
        // Don't fail the post creation if mention creation fails
        console.error('创建@通知失败:', mentionError)
      }
    }

    return successResponse({
      post: newPost,
      message: '发布成功',
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('创建帖子错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

