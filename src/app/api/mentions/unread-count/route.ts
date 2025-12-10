import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    // Count unread mentions
    const { count, error } = await supabaseAdmin
      .from('mentions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('获取未读通知失败:', error)
      return errorResponse('获取未读通知失败', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      count: count || 0,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取未读通知错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

















