import { z } from 'zod'

/**
 * 验证用户名（不超过5个汉字）
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: '用户名不能为空' }
  }
  
  // 检查长度（汉字、字母、数字、下划线，不超过5个汉字）
  const chineseRegex = /[\u4e00-\u9fa5]/g
  const chineseCount = (username.match(chineseRegex) || []).length
  
  if (chineseCount > 5) {
    return { valid: false, error: '用户名中的汉字不能超过5个' }
  }
  
  // 总长度限制
  if (username.length > 50) {
    return { valid: false, error: '用户名长度不能超过50个字符' }
  }
  
  // 只允许汉字、字母、数字、下划线
  const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/
  if (!validPattern.test(username)) {
    return { valid: false, error: '用户名只能包含汉字、字母、数字和下划线' }
  }
  
  return { valid: true }
}

/**
 * 验证邮箱格式
 */
export const emailSchema = z.string().email('邮箱格式不正确')

/**
 * 验证密码（最少8位）
 */
export const passwordSchema = z.string().min(8, '密码至少需要8个字符')

/**
 * 验证留言内容（150字限制）
 */
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '留言内容不能为空' }
  }
  
  if (content.length > 150) {
    return { valid: false, error: '留言内容不能超过150字' }
  }
  
  return { valid: true }
}

