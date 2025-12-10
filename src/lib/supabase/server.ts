import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 详细的错误检查
if (!supabaseUrl) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
    'Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL is set.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set.'
  )
}

// 服务端Supabase实例（使用anon key）
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

