import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 检查今天是否已经抽过奖
    // 先尝试使用 user_daily_records 表
    let existingDraw = null
    try {
      const { data, error } = await supabaseAdmin
        .from('user_daily_records')
        .select('id, reward_type, reward_id, reward_name, created_at')
        .eq('user_id', userId)
        .eq('record_date', today)
        .eq('record_type', 'lottery')
        .maybeSingle()

      if (!error && data) {
        existingDraw = data
      }
    } catch (err) {
      // 如果表不存在，从 user_rewards 表检查
      console.warn('user_daily_records 表可能不存在，尝试其他方式检查:', err)
    }

    // 如果 user_daily_records 表不存在，从 user_rewards 表检查今天是否有抽奖记录
    if (!existingDraw) {
      const todayStart = new Date(today + 'T00:00:00Z').toISOString()
      const todayEnd = new Date(today + 'T23:59:59Z').toISOString()
      
      const { data: todayRewards } = await supabaseAdmin
        .from('user_rewards')
        .select('id, reward_type, reward_id, reward_name, created_at')
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .in('reward_type', ['avatar_frame', 'name_color'])
        .limit(1)

      if (todayRewards && todayRewards.length > 0) {
        existingDraw = {
          id: todayRewards[0].id,
          reward_type: todayRewards[0].reward_type === 'avatar_frame' ? 'S' : 'A',
          reward_id: todayRewards[0].reward_id,
          reward_name: todayRewards[0].reward_name,
          created_at: todayRewards[0].created_at,
        }
      }
    }

    return successResponse({
      has_drawn_today: !!existingDraw,
      draw_record: existingDraw || null,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取抽奖状态错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

