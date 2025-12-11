import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search || !search.trim()) {
      return errorResponse('搜索参数不能为空', 'VALIDATION_ERROR', 400)
    }

    const searchTerm = search.trim()

    // Try to search by registration number first (if it's a number)
    const registrationNumber = parseInt(searchTerm)
    if (!isNaN(registrationNumber)) {
      const { data: userByNumber, error: numberError } = await supabaseAdmin
        .from('users')
        .select('id, username, registration_number, avatar_url')
        .eq('registration_number', registrationNumber)
        .single()

      if (!numberError && userByNumber) {
        return successResponse(userByNumber)
      }
    }

    // Search by username (case-insensitive, partial match)
    const { data: users, error: usernameError } = await supabaseAdmin
      .from('users')
      .select('id, username, registration_number, avatar_url')
      .ilike('username', `%${searchTerm}%`)
      .limit(10)

    if (usernameError) {
      console.error('搜索用户错误:', usernameError)
      return errorResponse('搜索失败', 'DATABASE_ERROR', 500)
    }

    if (!users || users.length === 0) {
      return notFoundResponse('未找到该用户')
    }

    // If multiple results, return the first exact match or first result
    const exactMatch = users.find(u => u.username.toLowerCase() === searchTerm.toLowerCase())
    if (exactMatch) {
      return successResponse(exactMatch)
    }

    // Return first result if multiple matches
    return successResponse(users[0])
  } catch (error) {
    console.error('搜索用户错误:', error)
    return errorResponse('服务器错误，请稍后重试', 'SERVER_ERROR', 500)
  }
}



