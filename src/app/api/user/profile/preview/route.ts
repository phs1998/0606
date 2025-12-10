export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

// Lightweight API for home page - only returns essential data
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    // Parallel queries for better performance
    const [
      userResult,
      profileResult,
      messageLikesResult,
      userPostsResult,
      userArticlesResult
    ] = await Promise.all([
      // 1. Get user info
      supabaseAdmin
        .from('users')
        .select('id, username, avatar_url, exp, registration_number, equipped_avatar_frame_id, unlocked_name_color_id, created_at')
        .eq('id', userId)
        .single(),
      // 2. Get user profile
      supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      // 3. Get message likes count
      supabaseAdmin
        .from('message_likes')
        .select('*', { count: 'exact', head: true })
        .eq('message_user_id', userId),
      // 4. Get user posts (for post likes calculation)
      supabaseAdmin
        .from('posts')
        .select('id')
        .eq('user_id', userId),
      // 5. Get user articles (for article likes calculation)
      supabaseAdmin
        .from('articles')
        .select('id')
        .eq('user_id', userId),
    ])

    if (userResult.error || !userResult.data) {
      return errorResponse('用户不存在', 'USER_NOT_FOUND', 404)
    }

    const user = userResult.data
    const profile = profileResult.data || null

    // Get equipped avatar frame and name color in parallel (after we have user data)
    const [frameResult, colorResult, postLikesResult, articleLikesResult] = await Promise.all([
      user.equipped_avatar_frame_id
        ? supabaseAdmin
            .from('avatar_frames')
            .select('id, name, image_url, icon_url')
            .eq('id', user.equipped_avatar_frame_id)
            .single()
            .then((result) => {
              if (result.data) {
                return { ...result.data, image_url: result.data.image_url || result.data.icon_url }
              }
              return null
            })
        : Promise.resolve(null),
      user.unlocked_name_color_id
        ? supabaseAdmin
            .from('name_colors')
            .select('id, name, color_code')
            .eq('id', user.unlocked_name_color_id)
            .single()
            .then((result) => result.data || null)
        : Promise.resolve(null),
      // Calculate post likes count
      (() => {
        const postIds = userPostsResult.data?.map((p: any) => p.id) || []
        return postIds.length > 0
          ? supabaseAdmin
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .in('post_id', postIds)
          : Promise.resolve({ count: 0 })
      })(),
      // Calculate article likes count
      (() => {
        const articleIds = userArticlesResult.data?.map((a: any) => a.id) || []
        return articleIds.length > 0
          ? supabaseAdmin
              .from('article_likes')
              .select('*', { count: 'exact', head: true })
              .in('article_id', articleIds)
          : Promise.resolve({ count: 0 })
      })(),
    ])

    // Sum all likes
    const totalLikesReceived = 
      (messageLikesResult.count || 0) + 
      (postLikesResult.count || 0) + 
      (articleLikesResult.count || 0)

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
      profile: profile,
      equipped_avatar_frame: frameResult,
      equipped_name_color: colorResult,
      total_likes_received: totalLikesReceived,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取用户资料预览错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

