export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        username,
        avatar_url,
        equipped_avatar_frame_id
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return notFoundResponse('用户不存在')
    }

    let frameUrl: string | null = null
    if (user.equipped_avatar_frame_id) {
      const { data: frame, error: frameError } = await supabaseAdmin
        .from('avatar_frames')
        .select('*') // Select all fields to get image_url or icon_url
        .eq('id', user.equipped_avatar_frame_id)
        .single()

      if (frameError) {
        console.warn('获取头像框信息错误:', frameError)
      } else if (frame) {
        frameUrl = frame.image_url || frame.icon_url || null // Prioritize image_url, then icon_url
      }
    }

    return successResponse({
      userId: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      frame_url: frameUrl,
    })
  } catch (error: any) {
    console.error('获取用户头像和头像框错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}






























