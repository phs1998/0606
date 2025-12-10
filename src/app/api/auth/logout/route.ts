import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  // 清除Cookie（如果使用Cookie存储token）
  const response = successResponse({ message: '登出成功' })
  
  // 设置Cookie过期
  response.cookies.set('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  
  return response
}
























