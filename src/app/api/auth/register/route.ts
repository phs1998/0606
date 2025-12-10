import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { validateUsername, emailSchema, passwordSchema } from '@/lib/utils/validation'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    // 验证必填字段
    if (!username || !email || !password) {
      return errorResponse('用户名、邮箱和密码都是必填项', 'VALIDATION_ERROR', 400)
    }

    // 验证用户名（不超过5个汉字）
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return errorResponse(usernameValidation.error!, 'VALIDATION_ERROR', 400)
    }

    // 验证邮箱格式
    const emailValidation = emailSchema.safeParse(email)
    if (!emailValidation.success) {
      return errorResponse('邮箱格式不正确', 'VALIDATION_ERROR', 400)
    }

    // 验证密码
    const passwordValidation = passwordSchema.safeParse(password)
    if (!passwordValidation.success) {
      return errorResponse('密码至少需要8个字符', 'VALIDATION_ERROR', 400)
    }

    // 检查用户名是否已存在
    const { data: existingUserByUsername } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUserByUsername) {
      return errorResponse('用户名已存在', 'USERNAME_EXISTS', 409)
    }

    // 检查邮箱是否已存在
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUserByEmail) {
      return errorResponse('邮箱已被注册', 'EMAIL_EXISTS', 409)
    }

    // 加密密码
    const passwordHash = await hashPassword(password)

    // 创建用户（registration_number会自动递增）
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
      })
      .select('id, username, email, registration_number, created_at')
      .single()

    if (userError || !newUser) {
      console.error('创建用户失败:', userError)
      return errorResponse('注册失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    // 创建用户资料
    await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
      })

    // 生成JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    })

    // 返回用户信息和token，并设置Cookie
    const response = successResponse({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        registration_number: newUser.registration_number,
        created_at: newUser.created_at,
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
    console.error('注册错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

