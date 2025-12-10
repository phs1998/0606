import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/utils/response'

// 奖励概率配置
const REWARD_PROBABILITIES = {
  S: 0.01, // 1%
  A: 0.05, // 5%
  B: 0.10, // 10%
  NONE: 0.84, // 84%
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    const userId = currentUser.userId

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 检查今天是否已经抽过奖
    // 先尝试使用 user_daily_records 表，如果不存在则使用 user_rewards 表检查
    let existingDraw = null
    try {
      const { data, error } = await supabaseAdmin
        .from('user_daily_records')
        .select('id, reward_type, reward_id, reward_name, created_at')
        .eq('user_id', userId)
        .eq('record_date', today)
        .eq('record_type', 'lottery')
        .maybeSingle()

      if (!error && data) {
        existingDraw = data
      }
    } catch (err) {
      // 如果表不存在，尝试从 user_rewards 表检查今天的抽奖记录
      console.warn('user_daily_records 表可能不存在，尝试其他方式检查:', err)
    }

    // 如果 user_daily_records 表不存在，从 user_rewards 表检查今天是否有抽奖记录
    if (!existingDraw) {
      const todayStart = new Date(today + 'T00:00:00Z').toISOString()
      const todayEnd = new Date(today + 'T23:59:59Z').toISOString()
      
      const { data: todayRewards } = await supabaseAdmin
        .from('user_rewards')
        .select('id, reward_type, reward_id, reward_name, created_at')
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .in('reward_type', ['avatar_frame', 'name_color'])
        .limit(1)

      if (todayRewards && todayRewards.length > 0) {
        // 假设如果今天有奖励记录，说明已经抽过奖了
        return errorResponse('今日已抽奖，请明天再来', 'ALREADY_DRAWN_TODAY', 400)
      }
    } else {
      return errorResponse('今日已抽奖，请明天再来', 'ALREADY_DRAWN_TODAY', 400)
    }

    // 抽奖逻辑
    const random = Math.random()
    let rewardType: 'S' | 'A' | 'B' | 'NONE' = 'NONE'
    let cumulative = 0

    if (random <= REWARD_PROBABILITIES.S) {
      rewardType = 'S'
    } else if (random <= REWARD_PROBABILITIES.S + REWARD_PROBABILITIES.A) {
      rewardType = 'A'
    } else if (random <= REWARD_PROBABILITIES.S + REWARD_PROBABILITIES.A + REWARD_PROBABILITIES.B) {
      rewardType = 'B'
    } else {
      rewardType = 'NONE'
    }

    let rewardId: string | null = null
    let rewardName: string | null = null
    let rewardData: any = null

    // 如果抽中奖励，从对应的奖励表中随机选择一个
    if (rewardType !== 'NONE') {
      let tableName = ''
      let rewardTypeForDB = ''
      
      if (rewardType === 'S') {
        tableName = 'avatar_frames' // 假设S级是头像框
        rewardTypeForDB = 'avatar_frame'
      } else if (rewardType === 'A') {
        tableName = 'name_colors' // 假设A级是昵称颜色
        rewardTypeForDB = 'name_color'
      } else if (rewardType === 'B') {
        tableName = 'name_colors' // B级也是昵称颜色
        rewardTypeForDB = 'name_color'
      }

      if (tableName) {
        try {
          const { data: rewards, error: rewardsError } = await supabaseAdmin
            .from(tableName)
            .select('id, name')
            .limit(100)

          if (rewardsError) {
            console.error(`查询${tableName}表错误:`, rewardsError)
            // 如果查询失败，将奖励类型改为未中奖
            rewardType = 'NONE'
            rewardId = null
            rewardName = null
            rewardData = null
          } else if (rewards && rewards.length > 0) {
            const randomReward = rewards[Math.floor(Math.random() * rewards.length)]
            rewardId = randomReward.id
            rewardName = randomReward.name
            rewardData = randomReward

            // 如果抽中奖励，添加到用户奖励表
            if (rewardId) {
              const { error: rewardError } = await supabaseAdmin
                .from('user_rewards')
                .insert({
                  user_id: userId,
                  reward_id: rewardId,
                  reward_type: rewardTypeForDB,
                  reward_name: rewardName,
                })

              if (rewardError) {
                console.error('添加奖励到用户奖励表错误:', rewardError)
                // 如果插入失败，仍然返回抽奖结果
                // 奖励可能未保存，但不影响抽奖流程
              }
            }
          } else {
            console.warn(`${tableName}表中没有可用的奖励，将结果设为未中奖`)
            // 如果表中没有奖励，将结果设为未中奖
            rewardType = 'NONE'
            rewardId = null
            rewardName = null
            rewardData = null
          }
        } catch (err) {
          console.error(`处理${tableName}奖励时出错:`, err)
          // 发生错误时，将结果设为未中奖
          rewardType = 'NONE'
          rewardId = null
          rewardName = null
          rewardData = null
        }
      }
    }

    // 创建抽奖记录（如果表存在）
    let drawRecord = null
    try {
      const { data, error } = await supabaseAdmin
        .from('user_daily_records')
        .insert({
          user_id: userId,
          record_date: today,
          record_type: 'lottery',
          reward_type: rewardType,
          reward_id: rewardId,
          reward_name: rewardName,
        })
        .select()
        .single()

      if (!error && data) {
        drawRecord = data
      }
    } catch (err) {
      // 如果表不存在，忽略错误，只记录到 user_rewards 表即可
      console.warn('user_daily_records 表可能不存在，跳过记录创建:', err)
    }

    return successResponse({
      reward_type: rewardType,
      reward_id: rewardId,
      reward_name: rewardName,
      reward_data: rewardData,
      is_win: rewardType !== 'NONE',
      draw_record: drawRecord,
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权，请先登录', 'UNAUTHORIZED', 401)
    }
    console.error('抽奖错误:', error)
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return errorResponse(
      error.message || '服务器错误，请稍后重试',
      'SERVER_ERROR',
      500
    )
  }
}

