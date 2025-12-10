import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 客户端代码在浏览器中运行，环境变量应该在构建时被注入
// 在构建时如果环境变量不存在，使用占位符值避免构建失败
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build'

// 验证环境变量的辅助函数（在运行时调用）
export function validateSupabaseEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
      'Please check your environment variables and ensure NEXT_PUBLIC_SUPABASE_URL is set.'
    )
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Please check your environment variables and ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set.'
    )
  }
}

// 客户端Supabase实例（用于客户端）
// 注意：在构建时使用占位符，但在运行时必须设置正确的环境变量
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

