import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 验证必填字段
    if (!email || !password) {
      return errorResponse('邮箱和密码都是必填项', 'VALIDATION_ERROR', 400)
    }

    // 查找用户
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, password_hash, registration_number, avatar_url, is_active')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return errorResponse('邮箱或密码错误', 'INVALID_CREDENTIALS', 401)
    }

    // 检查账户是否激活
    if (!user.is_active) {
      return errorResponse('账户已被禁用', 'ACCOUNT_INACTIVE', 403)
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return errorResponse('邮箱或密码错误', 'INVALID_CREDENTIALS', 401)
    }

    // 更新最后登录时间
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    // 返回用户信息和token，并设置Cookie
    const response = successResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        registration_number: user.registration_number,
        avatar_url: user.avatar_url,
      },
      token,
    })

    // Set token in HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('登录错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

