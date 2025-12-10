import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 在构建时，如果环境变量不存在，使用占位符值
// 这样可以避免构建失败，但在运行时必须设置正确的环境变量
// Cloudflare 等平台在构建时可能没有环境变量，所以我们需要允许占位符值
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build'

// 验证环境变量的辅助函数（在运行时调用，用于 API 路由中）
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

// 服务端Supabase实例（使用anon key）
// 注意：在构建时可能使用占位符值，但在运行时必须设置正确的环境变量
// 如果环境变量未设置，Supabase 操作会失败，但不会阻止构建
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

