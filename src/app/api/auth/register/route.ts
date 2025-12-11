import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { validateUsername, emailSchema, passwordSchema } from '@/lib/utils/validation'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 添加调试日志
  console.log('=== 注册请求收到 ===')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  console.log('Content-Type:', request.headers.get('content-type'))
  
  try {
    // 验证环境变量（记录详细信息以便调试）
    const missingVars: string[] = []
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    // 记录环境变量状态（不记录实际值，只记录是否存在和长度）
    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...' || 'N/A'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      JWT_SECRET: {
        exists: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length || 0,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      },
    }
    
    console.log('环境变量检查:', JSON.stringify(envStatus, null, 2))
    console.log('运行环境:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    })
    
    if (!envCheck.NEXT_PUBLIC_SUPABASE_URL) {
      missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    if (!envCheck.JWT_SECRET) {
      missingVars.push('JWT_SECRET')
    }
    
    if (missingVars.length > 0) {
      const errorDetails = {
        missingVars,
        envCheck,
        envStatus,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV,
        },
      }
      console.error('缺少环境变量:', JSON.stringify(errorDetails, null, 2))
      
      // 提供更详细的错误信息
      let errorMessage = `服务器配置错误：缺少必需的环境变量 (${missingVars.join(', ')})。\n\n`
      errorMessage += `请检查 Vercel 环境变量配置：\n`
      errorMessage += `1. 登录 Vercel Dashboard\n`
      errorMessage += `2. 进入项目设置 > Environment Variables\n`
      errorMessage += `3. 确保以下变量已配置到 Production 环境：\n`
      missingVars.forEach(v => {
        errorMessage += `   - ${v}\n`
      })
      errorMessage += `4. 配置后需要重新部署才能生效\n`
      
      return errorResponse(
        errorMessage,
        'CONFIG_ERROR',
        500
      )
    }

    // 检查环境变量值是否有效（不是占位符）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      console.error('检测到占位符值 NEXT_PUBLIC_SUPABASE_URL')
      return errorResponse(
        '服务器配置错误：NEXT_PUBLIC_SUPABASE_URL 使用了占位符值。请在 Vercel 中配置正确的环境变量。',
        'CONFIG_ERROR',
        500
      )
    }
    
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-key-for-build') {
      console.error('检测到占位符值 NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return errorResponse(
        '服务器配置错误：NEXT_PUBLIC_SUPABASE_ANON_KEY 使用了占位符值。请在 Vercel 中配置正确的环境变量。',
        'CONFIG_ERROR',
        500
      )
    }

    // 检查是否使用了 service role key（推荐用于服务端操作）
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('警告: 未设置 SUPABASE_SERVICE_ROLE_KEY，使用 anon key。这可能导致 RLS 策略问题。')
    }

    // 解析请求体
    let body: any
    try {
      body = await request.json()
      console.log('请求体解析成功')
    } catch (jsonError: any) {
      console.error('JSON解析错误:', {
        error: jsonError.message,
        name: jsonError.name,
      })
      return errorResponse('请求格式错误：无法解析JSON数据', 'INVALID_REQUEST', 400)
    }

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
    const { data: existingUserByUsername, error: usernameCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    // 如果查询出错（非"未找到"错误），记录错误
    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('检查用户名错误:', usernameCheckError)
    }

    if (existingUserByUsername) {
      return errorResponse('用户名已存在', 'USERNAME_EXISTS', 409)
    }

    // 检查邮箱是否已存在
    const { data: existingUserByEmail, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    // 如果查询出错（非"未找到"错误），记录错误
    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.error('检查邮箱错误:', emailCheckError)
    }

    if (existingUserByEmail) {
      return errorResponse('邮箱已被注册', 'EMAIL_EXISTS', 409)
    }

    // 加密密码
    let passwordHash: string
    try {
      passwordHash = await hashPassword(password)
    } catch (hashError) {
      console.error('密码加密失败:', hashError)
      return errorResponse('注册失败，请稍后重试', 'HASH_ERROR', 500)
    }

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

    if (userError) {
      const errorDetails = {
        error: userError,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
      console.error('创建用户失败:', JSON.stringify(errorDetails, null, 2))
      
      // 处理特定的数据库错误
      if (userError.code === '23505') { // 唯一约束违反
        if (userError.message?.includes('username') || userError.message?.includes('users_username_key')) {
          return errorResponse('用户名已存在', 'USERNAME_EXISTS', 409)
        }
        if (userError.message?.includes('email') || userError.message?.includes('users_email_key')) {
          return errorResponse('邮箱已被注册', 'EMAIL_EXISTS', 409)
        }
      }
      
      // 处理 RLS 策略错误
      if (userError.code === '42501' || userError.message?.includes('permission denied') || userError.message?.includes('RLS')) {
        console.error('RLS 策略错误: 请确保设置了 SUPABASE_SERVICE_ROLE_KEY 或配置了正确的 RLS 策略')
        return errorResponse('数据库权限错误，请联系管理员', 'PERMISSION_ERROR', 500)
      }
      
      return errorResponse('注册失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    if (!newUser) {
      console.error('创建用户失败: 返回数据为空')
      return errorResponse('注册失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    // 创建用户资料
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
      })

    if (profileError) {
      console.error('创建用户资料失败:', profileError)
      // 即使资料创建失败，用户已经创建，所以继续执行
      // 可以考虑回滚用户创建，但为了简化，这里只记录错误
      // 注意：用户资料可以在后续通过更新接口创建
    } else {
      console.log('用户资料创建成功')
    }

    // 生成JWT token
    let token: string
    try {
      token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
      })
    } catch (tokenError) {
      console.error('生成 token 失败:', tokenError)
      return errorResponse('注册失败，请稍后重试', 'TOKEN_ERROR', 500)
    }

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
    // 在 Vercel 生产环境中，secure 应该为 true（因为使用 HTTPS）
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction, // Vercel 使用 HTTPS，所以 secure 应该为 true
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('注册错误:', {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      type: typeof error,
    })
    
    // 处理 JSON 解析错误
    if (error instanceof SyntaxError || error.name === 'SyntaxError') {
      console.error('JSON解析错误')
      return errorResponse('请求格式错误：无法解析JSON数据', 'INVALID_REQUEST', 400)
    }
    
    // 处理其他已知错误
    if (error?.message?.includes('Unexpected token')) {
      return errorResponse('请求格式错误：JSON格式不正确', 'INVALID_REQUEST', 400)
    }
    
    // 确保返回正确的HTTP响应
    try {
      return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
    } catch (responseError) {
      // 如果连错误响应都无法创建，返回最基本的响应
      console.error('无法创建错误响应:', responseError)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: '服务器内部错误',
          code: 'SERVER_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
}

