import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // 获取用户基本信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        username,
        registration_number,
        avatar_url,
        created_at
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return notFoundResponse('用户不存在')
    }

    // 获取用户资料
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 获取用户统计信息
    const [messagesResult, drawsResult] = await Promise.all([
      supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true),
      supabaseAdmin
        .from('story_draws')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    return successResponse({
      id: user.id,
      username: user.username,
      registration_number: user.registration_number,
      avatar_url: user.avatar_url,
      profile: profile || null,
      stats: {
        message_count: messagesResult.count || 0,
        story_draw_count: drawsResult.count || 0,
      },
      created_at: user.created_at,
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

