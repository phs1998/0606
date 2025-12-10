import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const currentUser = await requireAuth(request)

    // 获取用户完整信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        username,
        email,
        registration_number,
        avatar_url,
        is_active,
        is_admin,
        last_login_at,
        created_at,
        updated_at
      `)
      .eq('id', currentUser.userId)
      .single()

    if (userError || !user) {
      return errorResponse('用户不存在', 'USER_NOT_FOUND', 404)
    }

    // 获取用户资料
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUser.userId)
      .single()

    return successResponse({
      id: user.id,
      username: user.username,
      email: user.email,
      registration_number: user.registration_number,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      is_admin: user.is_admin,
      last_login_at: user.last_login_at,
      profile: profile || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取用户信息错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

