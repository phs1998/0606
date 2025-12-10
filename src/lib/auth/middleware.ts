import { NextRequest } from 'next/server'
import { verifyToken, extractTokenFromHeader, JWTPayload } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

/**
 * 从请求中获取当前用户信息
 */
export async function getCurrentUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) {
    // 尝试从Cookie中获取
    const cookieToken = request.cookies.get('token')?.value
    if (cookieToken) {
      return verifyToken(cookieToken)
    }
    return null
  }
  
  return verifyToken(token)
}

/**
 * 验证用户是否已登录
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  
  return user
}

