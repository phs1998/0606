import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)

    // 获取用户资料
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUser.userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 表示未找到记录，这是正常的（用户可能还没有创建资料）
      console.error('获取用户资料错误:', profileError)
      return errorResponse('获取用户资料失败', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      profile: profile || null,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取用户资料错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const body = await request.json()

    const {
      display_name,
      bio,
      location,
      website,
      birthday,
      gender,
      social_links,
      custom_fields,
      theme_color,
    } = body

    // 构建更新数据
    const updateData: any = {}
    if (display_name !== undefined) updateData.display_name = display_name
    if (bio !== undefined) updateData.bio = bio
    if (location !== undefined) updateData.location = location
    if (website !== undefined) updateData.website = website
    if (birthday !== undefined) updateData.birthday = birthday
    if (gender !== undefined) updateData.gender = gender
    if (social_links !== undefined) updateData.social_links = social_links
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields
    if (theme_color !== undefined) updateData.theme_color = theme_color

    // 检查用户资料是否存在
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', currentUser.userId)
      .single()

    let result
    if (existingProfile) {
      // 更新现有资料
      const { data: profile, error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', currentUser.userId)
        .select()
        .single()

      if (updateError) {
        console.error('更新用户资料错误:', updateError)
        return errorResponse('更新用户资料失败', 'DATABASE_ERROR', 500)
      }

      result = profile
    } else {
      // 创建新资料
      const { data: profile, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: currentUser.userId,
          ...updateData,
        })
        .select()
        .single()

      if (insertError) {
        console.error('创建用户资料错误:', insertError)
        return errorResponse('创建用户资料失败', 'DATABASE_ERROR', 500)
      }

      result = profile
    }

    return successResponse({
      profile: result,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('更新用户资料错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

