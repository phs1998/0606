import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

interface UserProfileResponse {
  user: {
    id: string
    username: string
    email: string
    avatar_url?: string | null
    exp: number
    registration_number: number
    registration_number_display: string
    equipped_avatar_frame_id?: string | null
    unlocked_name_color_id?: string | null
    created_at: string
  }
  profile: {
    bio?: string | null
    background_image_url?: string | null
  } | null
  unlocked_avatar_frames: any[]
  unlocked_name_colors: any[]
  equipped_avatar_frame: any | null
  equipped_name_color: any | null
  total_likes_received: number
  allFrames: any[]
  allColors: any[]
}

interface RewardsResponse {
  rewards: any[]
  total: number
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="p-8 text-center bg-white rounded-2xl shadow-xl max-w-md">
          <p className="text-gray-700 mb-4">请先登录以查看个人资料。</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            前往登录
          </a>
        </div>
      </div>
    )
  }

  let userData: UserProfileResponse
  let rewardsData: RewardsResponse

  try {
    // Verify token first
    const jwtPayload = verifyToken(token)
    if (!jwtPayload || !jwtPayload.userId) {
        redirect('/')
    }
    const userId = jwtPayload.userId

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
      rewardsResult,
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
      // 10. Get rewards data
      supabaseAdmin
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    const { data: user, error: userError } = userResult
    if (userError || !user) {
      throw new Error('用户不存在')
    }

    const { data: profile } = profileResult
    const { data: avatarFrameRewards } = avatarFrameRewardsResult
    const { data: nameColorRewards } = nameColorRewardsResult
    const { count: messageLikesCount } = messageLikesResult
    const { data: userPosts } = userPostsResult
    const { data: userArticles } = userArticlesResult
    const { data: allFrames } = allFramesResult
    const { data: allColors } = allColorsResult
    const { data: rewards } = rewardsResult

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

    // Build userData
    userData = {
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
    }

    rewardsData = {
      rewards: rewards || [],
      total: rewards?.length || 0,
    }

  } catch (error) {
    console.error('Profile page error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="p-8 text-center bg-white rounded-2xl shadow-xl max-w-md">
          <p className="text-red-600 mb-4">加载失败，请重试。</p>
          <p className="text-xs text-gray-500 mb-4">{error instanceof Error ? error.message : '未知错误'}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            返回登录页
          </a>
        </div>
      </div>
    )
  }

  // 使用Suspense优化首屏加载体验
  return (
    <ProfileClient
      initialProfileData={userData}
      initialRewardsData={rewardsData}
      token={token}
    />
  )
}

