import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader) || request.cookies.get('token')?.value

    if (!token) { return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401) }
    const jwtPayload = verifyToken(token)
    if (!jwtPayload || !jwtPayload.userId) { return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401) }
    const userId = jwtPayload.userId

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    if (!type || type !== 'avatar') { return errorResponse('type 参数必须是 avatar', 'VALIDATION_ERROR', 400) }

    // Get current user info to check change counts and reset date
    const { data: currentUser, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('avatar_changes_this_month, last_change_reset_date')
      .eq('id', userId)
      .single()

    if (fetchUserError || !currentUser) {
      console.error('获取用户信息失败:', fetchUserError)
      return errorResponse('获取用户信息失败', 'DATABASE_ERROR', 500)
    }

    // Get the first day of the current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthDate = firstDayOfMonth.toISOString().split('T')[0]

    let needsReset = false
    if (!currentUser.last_change_reset_date) {
      needsReset = true
    } else {
      const resetDate = new Date(currentUser.last_change_reset_date)
      const resetDateFirstDay = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1)
      if (resetDateFirstDay.getTime() !== firstDayOfMonth.getTime()) {
        needsReset = true
      }
    }

    let changeCount = 0
    if (needsReset) {
      changeCount = 0
    } else {
      changeCount = currentUser.avatar_changes_this_month || 0
    }

    return successResponse({
      count: changeCount,
      max_count: 3,
      remaining: Math.max(0, 3 - changeCount),
      type,
    })
  } catch (error: any) {
    console.error('获取修改次数错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}






