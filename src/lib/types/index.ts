// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
  registration_number: number
  avatar_url?: string | null
  is_active: boolean
  is_admin: boolean
  last_login_at?: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  display_name?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  birthday?: string | null
  gender?: string | null
  social_links?: Record<string, any> | null
  custom_fields?: Record<string, any> | null
  theme_color?: string | null
  created_at: string
  updated_at: string
}

// 故事相关类型
export interface DailyStory {
  id: string
  title: string
  content: string
  author?: string | null
  category?: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image_url?: string | null
  date: string
  is_active: boolean
  view_count: number
  draw_count: number
  created_at: string
  updated_at: string
}

export interface StoryDraw {
  id: string
  user_id: string
  story_id: string
  draw_date: string
  rarity: string
  created_at: string
}

// 留言相关类型
export interface Message {
  id: string
  user_id: string
  content: string
  is_public: boolean
  is_pinned: boolean
  like_count: number
  reply_count: number
  parent_message_id?: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    username: string
    avatar_url?: string | null
    registration_number: number
  }
  replies?: Message[]
  is_liked?: boolean
}

