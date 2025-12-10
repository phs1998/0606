import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response'

// 获取今日故事
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { data: story, error: storyError } = await supabaseAdmin
      .from('daily_stories')
      .select('*')
      .eq('date', today)
      .eq('is_active', true)
      .single()

    if (storyError || !story) {
      return notFoundResponse('今天还没有故事')
    }

    // 增加查看次数
    await supabaseAdmin
      .from('daily_stories')
      .update({ view_count: (story.view_count || 0) + 1 })
      .eq('id', story.id)

    return successResponse({
      ...story,
      view_count: (story.view_count || 0) + 1,
    })
  } catch (error) {
    console.error('获取今日故事错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

