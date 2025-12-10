import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response'

// 每日故事抽奖
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const body = await request.json()
    const drawDate = body.date || new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 检查今天是否已经抽过奖
    const { data: existingDraw } = await supabaseAdmin
      .from('story_draws')
      .select('id, story_id, rarity')
      .eq('user_id', currentUser.userId)
      .eq('draw_date', drawDate)
      .single()

    if (existingDraw) {
      // 如果已经抽过，返回已抽中的故事
      const { data: story } = await supabaseAdmin
        .from('daily_stories')
        .select('*')
        .eq('id', existingDraw.story_id)
        .single()

      return successResponse({
        story: story || null,
        draw_record: existingDraw,
        is_first_draw_today: false,
      })
    }

    // 获取当天的故事
    const { data: todayStory, error: storyError } = await supabaseAdmin
      .from('daily_stories')
      .select('*')
      .eq('date', drawDate)
      .eq('is_active', true)
      .single()

    if (storyError || !todayStory) {
      return notFoundResponse('今天还没有可用的故事')
    }

    // 抽奖逻辑：根据稀有度分配概率
    // common: 60%, rare: 25%, epic: 10%, legendary: 5%
    const rarityWeights = {
      common: 0.6,
      rare: 0.25,
      epic: 0.1,
      legendary: 0.05,
    }

    const random = Math.random()
    let selectedRarity = 'common'
    let cumulative = 0

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulative += weight
      if (random <= cumulative) {
        selectedRarity = rarity
        break
      }
    }

    // 创建抽奖记录
    const { data: drawRecord, error: drawError } = await supabaseAdmin
      .from('story_draws')
      .insert({
        user_id: currentUser.userId,
        story_id: todayStory.id,
        draw_date: drawDate,
        rarity: selectedRarity,
      })
      .select()
      .single()

    if (drawError) {
      console.error('创建抽奖记录错误:', drawError)
      return errorResponse('抽奖失败，请稍后重试', 'DATABASE_ERROR', 500)
    }

    return successResponse({
      story: {
        ...todayStory,
        rarity: selectedRarity, // 返回抽中的稀有度
      },
      draw_record: drawRecord,
      is_first_draw_today: true,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('抽奖错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}

