import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  })
}

/**
 * 错误响应
 */
export function errorResponse(
  error: string,
  code?: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
    },
    { status }
  )
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(message: string = '未授权，请先登录'): NextResponse<ApiResponse> {
  return errorResponse(message, 'UNAUTHORIZED', 401)
}

/**
 * 禁止访问响应
 */
export function forbiddenResponse(message: string = '无权访问此资源'): NextResponse<ApiResponse> {
  return errorResponse(message, 'FORBIDDEN', 403)
}

/**
 * 未找到响应
 */
export function notFoundResponse(message: string = '资源不存在'): NextResponse<ApiResponse> {
  return errorResponse(message, 'NOT_FOUND', 404)
}

