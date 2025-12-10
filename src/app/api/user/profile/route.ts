export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    // 并行执行所有数据库查询以优化性能
    const [
      userResult,
      profileResult,
      avatarFrameRewardsResult,
      nameColorRewardsResult,
      messageLikesResult,
      userPostsResult,
      userArticlesResult,
      allFramesResult,
      allColorsResult,
    ] = await Promise.all([
      // 1. Get user info
      supabaseAdmin
        .from('users')
        .select('id, username, email, avatar_url, exp, registration_number, equipped_avatar_frame_id, unlocked_name_color_id, created_at')
        .eq('id', userId)
        .single(),
      // 2. Get user profile
      supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      // 3. Query unlocked avatar frames rewards
      supabaseAdmin
        .from('user_rewards')
        .select('reward_id, reward_name, created_at')
        .eq('user_id', userId)
        .in('reward_type', ['S', 'avatar_frame'])
        .not('reward_id', 'is', null),
      // 4. Query unlocked name colors rewards
      supabaseAdmin
        .from('user_rewards')
        .select('reward_id, reward_name, created_at')
        .eq('user_id', userId)
        .eq('reward_type', 'name_color')
        .not('reward_id', 'is', null),
      // 5. Get message likes count
      supabaseAdmin
        .from('message_likes')
        .select('*', { count: 'exact', head: true })
        .eq('message_user_id', userId),
      // 6. Get user posts (for post likes count)
      supabaseAdmin
        .from('posts')
        .select('id')
        .eq('user_id', userId),
      // 7. Get user articles (for article likes count)
      supabaseAdmin
        .from('articles')
        .select('id')
        .eq('user_id', userId),
      // 8. Query all available avatar frames
      supabaseAdmin
        .from('avatar_frames')
        .select('*')
        .order('rarity', { ascending: false }),
      // 9. Query all available name colors
      supabaseAdmin
        .from('name_colors')
        .select('*'),
    ])

    const { data: user, error: userError } = userResult
    if (userError || !user) {
      return errorResponse('用户不存在', 'USER_NOT_FOUND', 404)
    }

    const { data: profile } = profileResult
    const { data: avatarFrameRewards } = avatarFrameRewardsResult
    const { data: nameColorRewards } = nameColorRewardsResult
    const { count: messageLikesCount } = messageLikesResult
    const { data: userPosts } = userPostsResult
    const { data: userArticles } = userArticlesResult
    const { data: allFrames } = allFramesResult
    const { data: allColors } = allColorsResult

    // 并行获取装备的头像框和昵称颜色（如果存在）
    const equippedQueries = []
    if (user.equipped_avatar_frame_id) {
      equippedQueries.push(
        supabaseAdmin
          .from('avatar_frames')
          .select('*')
          .eq('id', user.equipped_avatar_frame_id)
          .single()
          .then(({ data: frame }) => frame ? { ...frame, image_url: frame.image_url || frame.icon_url } : null)
      )
    } else {
      equippedQueries.push(Promise.resolve(null))
    }

    if (user.unlocked_name_color_id) {
      equippedQueries.push(
        supabaseAdmin
          .from('name_colors')
          .select('*')
          .eq('id', user.unlocked_name_color_id)
          .single()
          .then(({ data: color }) => color || null)
      )
    } else {
      equippedQueries.push(Promise.resolve(null))
    }

    const [equippedAvatarFrame, equippedNameColor] = await Promise.all(equippedQueries)

    // 处理解锁的头像框
    const unlockedFrameIds = (avatarFrameRewards || []).map((r: any) => r.reward_id).filter(Boolean)
    let unlockedAvatarFrames: any[] = []
    if (unlockedFrameIds.length > 0) {
      const { data: frames } = await supabaseAdmin
        .from('avatar_frames')
        .select('*')
        .in('id', unlockedFrameIds)
      
      unlockedAvatarFrames = (frames || []).map((frame: any) => ({
        ...frame,
        image_url: frame.image_url || frame.icon_url,
      }))
    }

    // 处理解锁的昵称颜色
    const unlockedColorIds = (nameColorRewards || []).map((r: any) => r.reward_id).filter(Boolean)
    let unlockedNameColors: any[] = []
    if (unlockedColorIds.length > 0) {
      const { data: colors } = await supabaseAdmin
        .from('name_colors')
        .select('*')
        .in('id', unlockedColorIds)
      
      unlockedNameColors = colors || []
    }

    // 并行获取点赞数
    const postIds = userPosts?.map((p: any) => p.id) || []
    const articleIds = userArticles?.map((a: any) => a.id) || []
    
    const [
      postLikesResult,
      articleLikesResult,
    ] = await Promise.all([
      postIds.length > 0
        ? supabaseAdmin
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds)
        : Promise.resolve({ count: 0 }),
      articleIds.length > 0
        ? supabaseAdmin
            .from('article_likes')
            .select('*', { count: 'exact', head: true })
            .in('article_id', articleIds)
        : Promise.resolve({ count: 0 }),
    ])

    const { count: postLikesCount } = postLikesResult
    const { count: articleLikesCount } = articleLikesResult

    // Sum all likes
    const totalLikesReceived = (messageLikesCount || 0) + (postLikesCount || 0) + (articleLikesCount || 0)

    // 处理所有头像框
    const processedAllFrames = (allFrames || []).map((frame: any) => ({
      ...frame,
      image_url: frame.image_url || frame.icon_url || null,
      icon_url: frame.icon_url || frame.image_url || null,
      unlock_condition: frame.unlock_condition || '未知条件',
    }))

    return successResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        exp: user.exp || 0,
        registration_number: user.registration_number,
        registration_number_display: `#${user.registration_number}`,
        equipped_avatar_frame_id: user.equipped_avatar_frame_id,
        unlocked_name_color_id: user.unlocked_name_color_id,
        created_at: user.created_at,
      },
      profile: profile || null,
      unlocked_avatar_frames: unlockedAvatarFrames,
      unlocked_name_colors: unlockedNameColors,
      equipped_avatar_frame: equippedAvatarFrame,
      equipped_name_color: equippedNameColor,
      total_likes_received: totalLikesReceived || 0,
      allFrames: processedAllFrames || [],
      allColors: allColors || [],
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取用户资料错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const body = await request.json()
    const { bio, avatar_url, equipped_avatar_frame_id, unlocked_name_color_id, background_image_id } = body

    // First get current user info, including avatar and change count fields
    const { data: currentUserData, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('avatar_url, avatar_changes_this_month, last_change_reset_date')
      .eq('id', userId)
      .single()

    if (fetchUserError || !currentUserData) {
      return errorResponse('获取用户信息失败', 'DATABASE_ERROR', 500)
    }

    const currentAvatarUrl = currentUserData.avatar_url || null

    // Get the first day of the current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthDate = firstDayOfMonth.toISOString().split('T')[0]

    // Check if reset is needed
    let needsReset = false
    if (!currentUserData.last_change_reset_date) {
      needsReset = true
    } else {
      const resetDate = new Date(currentUserData.last_change_reset_date)
      const resetDateFirstDay = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1)
      if (resetDateFirstDay.getTime() !== firstDayOfMonth.getTime()) {
        needsReset = true
      }
    }

    // Reset counts if needed
    let avatarChangesCount = currentUserData.avatar_changes_this_month || 0

    if (needsReset) {
      avatarChangesCount = 0
    }

    const profileUpdateData: any = {}
    const userUpdateData: any = {}

    if (needsReset) {
      userUpdateData.last_change_reset_date = firstDayOfMonthDate
    }

    // Update bio (no count consumption)
    if (bio !== undefined) {
      if (typeof bio !== 'string') { return errorResponse('bio 必须是字符串', 'VALIDATION_ERROR', 400) }
      profileUpdateData.bio = bio.trim()
    }

    // Independent check for avatar_url
    if (avatar_url !== undefined) {
      if (avatar_url !== null && typeof avatar_url !== 'string') { return errorResponse('avatar_url 必须是字符串或null', 'VALIDATION_ERROR', 400) }
      
      const avatarChanged = avatar_url !== currentAvatarUrl
      
      if (avatarChanged) {
        if (avatarChangesCount >= 3) { return errorResponse('本月头像修改次数（3次）已用尽', 'LIMIT_EXCEEDED', 429) }
        avatarChangesCount += 1
        userUpdateData.avatar_changes_this_month = avatarChangesCount
      }
      userUpdateData.avatar_url = avatar_url
    }

    // Update equipped_avatar_frame_id
    if (equipped_avatar_frame_id !== undefined) {
      // Verify the frame is unlocked
      if (equipped_avatar_frame_id) {
        const { data: reward } = await supabaseAdmin
          .from('user_rewards')
          .select('reward_id')
          .eq('user_id', userId)
          .eq('reward_id', equipped_avatar_frame_id)
          .in('reward_type', ['S', 'avatar_frame'])
          .single()

        if (!reward) {
          return errorResponse('您尚未解锁该头像框', 'NOT_UNLOCKED', 403)
        }
      }
      userUpdateData.equipped_avatar_frame_id = equipped_avatar_frame_id
    }

    // Update unlocked_name_color_id
    if (unlocked_name_color_id !== undefined) {
      // Verify the color is unlocked
      if (unlocked_name_color_id) {
        const { data: reward } = await supabaseAdmin
          .from('user_rewards')
          .select('reward_id')
          .eq('user_id', userId)
          .eq('reward_id', unlocked_name_color_id)
          .eq('reward_type', 'name_color')
          .single()

        if (!reward) {
          return errorResponse('您尚未解锁该昵称颜色', 'NOT_UNLOCKED', 403)
        }
      }
      userUpdateData.unlocked_name_color_id = unlocked_name_color_id
    }

    // Update background_image_id (存储背景ID，而不是完整URL)
    if (background_image_id !== undefined) {
      if (typeof background_image_id !== 'string' && background_image_id !== null) {
        return errorResponse('background_image_id 必须是字符串或null', 'VALIDATION_ERROR', 400)
      }
      // 将背景ID存储到profile的background_image_url字段中（为了兼容现有结构）
      // 如果background_image_id是空字符串，也转换为null
      // 如果background_image_id是'default'，存储为null（表示使用默认背景）
      // 否则存储实际的背景ID（如'vaporwave-stairs'）
      if (background_image_id === 'default' || (typeof background_image_id === 'string' && background_image_id.trim() === '')) {
        profileUpdateData.background_image_url = null
      } else if (background_image_id) {
        profileUpdateData.background_image_url = background_image_id.trim()
      } else {
        profileUpdateData.background_image_url = null
      }
    }

    // Update user_profiles table
    if (Object.keys(profileUpdateData).length > 0) {
      const { data: existingProfile } = await supabaseAdmin.from('user_profiles').select('id').eq('user_id', userId).single()
      if (existingProfile) {
        const { error: updateError } = await supabaseAdmin.from('user_profiles').update(profileUpdateData).eq('user_id', userId)
        if (updateError) { console.error('更新用户资料错误:', updateError); return errorResponse('更新用户资料失败', 'DATABASE_ERROR', 500) }
      } else {
        const { error: insertError } = await supabaseAdmin.from('user_profiles').insert({ user_id: userId, ...profileUpdateData })
        if (insertError) { console.error('创建用户资料错误:', insertError); return errorResponse('创建用户资料失败', 'DATABASE_ERROR', 500) }
      }
    }

    // Update users table
    if (Object.keys(userUpdateData).length > 0) {
      const { error: updateError } = await supabaseAdmin.from('users').update(userUpdateData).eq('id', userId)
      if (updateError) { console.error('更新用户信息错误:', updateError); return errorResponse('更新用户信息失败', 'DATABASE_ERROR', 500) }
    }

    // Return updated full profile
    const { data: updatedUser } = await supabaseAdmin.from('users').select(`id, username, email, avatar_url, registration_number, equipped_avatar_frame_id, unlocked_name_color_id`).eq('id', userId).single()
    const { data: updatedProfile } = await supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).single()

    return successResponse({ user: updatedUser, profile: updatedProfile || null, message: '资料更新成功' })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('更新用户资料错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}





