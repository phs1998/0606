import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

export const dynamic = 'force-dynamic'

// 获取用户抽奖历史
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    // 获取抽奖记录
    const { data: draws, error: drawsError } = await supabaseAdmin
      .from('story_draws')
      .select(`
        id,
        draw_date,
        rarity,
        created_at,
        story:daily_stories!story_draws_story_id_fkey (
          id,
          title,
          rarity,
          image_url
        )
      `)
      .eq('user_id', currentUser.userId)
      .order('draw_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (drawsError) {
      console.error('获取抽奖历史错误:', drawsError)
      return errorResponse('获取抽奖历史失败', 'DATABASE_ERROR', 500)
    }

    // 获取总数
    const { count } = await supabaseAdmin
      .from('story_draws')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', currentUser.userId)

    return successResponse({
      draws: draws || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('获取抽奖历史错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

