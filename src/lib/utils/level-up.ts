import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * 计算用户等级
 * @param exp 经验值
 * @returns 等级
 */
export function calculateLevel(exp: number): number {
  return Math.floor(exp / 100) + 1
}

/**
 * 检测用户是否升级，如果升级则创建升级通知
 * @param userId 用户ID
 * @param oldExp 旧经验值
 * @param newExp 新经验值
 */
export async function checkLevelUp(userId: string, oldExp: number, newExp: number): Promise<void> {
  try {
    const oldLevel = calculateLevel(oldExp)
    const newLevel = calculateLevel(newExp)

    // 如果等级提升了，创建升级通知
    if (newLevel > oldLevel) {
      // 创建升级通知（使用mentions表）
      // 对于系统消息，from_user_id可以是用户自己，或者我们可以使用一个特殊的系统用户ID
      // 这里我们使用用户自己作为from_user_id，但notification_type标记为'level_up'
      await supabaseAdmin
        .from('mentions')
        .insert({
          user_id: userId,
          from_user_id: userId, // 系统消息，使用用户自己作为发送者
          post_id: null,
          comment_id: null,
          article_id: null,
          notification_type: 'level_up',
          content: `恭喜你升到了${newLevel}级！`,
          is_read: false,
        })

      console.log(`用户 ${userId} 从 ${oldLevel} 级升级到 ${newLevel} 级`)
    }
  } catch (error) {
    console.error('检测升级或创建升级通知失败:', error)
    // 不抛出错误，避免影响主流程
  }
}









