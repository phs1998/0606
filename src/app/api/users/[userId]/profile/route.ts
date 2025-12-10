import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, avatar_url, exp, registration_number, equipped_avatar_frame_id, unlocked_name_color_id, created_at')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return errorResponse('用户不存在', 'USER_NOT_FOUND', 404)
    }

    // Get user profile (including background_image_url)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // If profile doesn't exist, that's okay - we'll return null
    // Only log actual errors (not "not found" errors)
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('获取用户profile错误:', profileError)
    }

    // Get equipped avatar frame info
    let equippedAvatarFrame = null
    if (user.equipped_avatar_frame_id) {
      const { data: frame } = await supabaseAdmin
        .from('avatar_frames')
        .select('*')
        .eq('id', user.equipped_avatar_frame_id)
        .single()
      
      equippedAvatarFrame = frame ? { ...frame, image_url: frame.image_url || frame.icon_url } : null
    }

    // Get equipped name color
    let equippedNameColor = null
    if (user.unlocked_name_color_id) {
      const { data: color } = await supabaseAdmin
        .from('name_colors')
        .select('*')
        .eq('id', user.unlocked_name_color_id)
        .single()
      
      equippedNameColor = color || null
    }

    // Get total likes received (from posts, articles, and messages)
    // 1. Get message likes count
    const { count: messageLikesCount } = await supabaseAdmin
      .from('message_likes')
      .select('*', { count: 'exact', head: true })
      .eq('message_user_id', userId)

    // 2. Get post likes count (likes on posts created by this user)
    const { data: userPosts } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('user_id', userId)

    const postIds = userPosts?.map((p: any) => p.id) || []
    const { count: postLikesCount } = postIds.length > 0
      ? await supabaseAdmin
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds)
      : { count: 0 }

    // 3. Get article likes count (likes on articles created by this user)
    const { data: userArticles } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('user_id', userId)

    const articleIds = userArticles?.map((a: any) => a.id) || []
    const { count: articleLikesCount } = articleIds.length > 0
      ? await supabaseAdmin
          .from('article_likes')
          .select('*', { count: 'exact', head: true })
          .in('article_id', articleIds)
      : { count: 0 }

    // Sum all likes
    const totalLikesReceived = (messageLikesCount || 0) + (postLikesCount || 0) + (articleLikesCount || 0)

    return successResponse({
      user: {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        exp: user.exp || 0,
        registration_number: user.registration_number,
        equipped_avatar_frame_id: user.equipped_avatar_frame_id,
        unlocked_name_color_id: user.unlocked_name_color_id,
        created_at: user.created_at,
      },
      profile: profile || null,
      equipped_avatar_frame: equippedAvatarFrame,
      equipped_name_color: equippedNameColor,
      total_likes_received: totalLikesReceived || 0,
    })
  } catch (error: any) {
    console.error('获取用户资料错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}


