import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const { data: rewards, error: rewardsError } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (rewardsError) {
      console.error('获取奖励数据错误:', rewardsError)
      return errorResponse('获取奖励数据失败', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      rewards: rewards || [],
      total: rewards?.length || 0,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取奖励数据错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}




















