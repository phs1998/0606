/**
 * 个人主页背景图片配置
 * 所有背景图片应放置在 public/backgrounds/ 目录下
 * 图片尺寸建议：1920x1080 或更高分辨率，保持16:9比例
 */

export interface BackgroundOption {
  id: string
  name: string
  url: string
  thumbnail?: string // 缩略图URL，用于选择界面预览
}

// 默认背景（当前使用的蒸汽波风格背景）
export const DEFAULT_BACKGROUND: BackgroundOption = {
  id: 'default',
  name: '默认背景',
  url: '', // 空字符串表示使用默认的CSS渐变背景
}

// 可选的背景图片列表
// 注意：请将图片文件放置在 public/backgrounds/ 目录下
// 图片命名建议：background-1.jpg, background-2.jpg 等
export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  DEFAULT_BACKGROUND,
  {
    id: 'vaporwave-stairs',
    name: '蒸汽波楼梯',
    url: '/backgrounds/vaporwave-stairs.jpg',
    thumbnail: '/backgrounds/vaporwave-stairs-thumb.jpg',
  },
  {
    id: 'tokyo-tower',
    name: '东京塔夜景',
    url: '/backgrounds/tokyo-tower.jpg',
    thumbnail: '/backgrounds/tokyo-tower-thumb.jpg',
  },
  {
    id: 'neon-profile',
    name: '霓虹侧影',
    url: '/backgrounds/neon-profile.jpg',
    thumbnail: '/backgrounds/neon-profile-thumb.jpg',
  },
  {
    id: 'arcade-girl',
    name: '街机少女',
    url: '/backgrounds/arcade-girl.jpg',
    thumbnail: '/backgrounds/arcade-girl-thumb.jpg',
  },
  {
    id: 'pool-party',
    name: '泳池派对',
    url: '/backgrounds/pool-party.jpg',
    thumbnail: '/backgrounds/pool-party-thumb.jpg',
  },
]

/**
 * 根据背景ID获取背景选项
 */
export function getBackgroundById(id: string | null | undefined): BackgroundOption {
  if (!id || (typeof id === 'string' && id.trim() === '')) {
    return DEFAULT_BACKGROUND
  }
  const found = BACKGROUND_OPTIONS.find(bg => bg.id === id)
  if (!found) {
    return DEFAULT_BACKGROUND
  }
  return found
}

/**
 * 获取背景图片URL
 * 如果为空或default，返回null（使用默认CSS背景）
 */
export function getBackgroundUrl(id: string | null | undefined): string | null {
  // 如果id为null、undefined或空字符串，返回null使用默认背景
  if (!id || (typeof id === 'string' && id.trim() === '')) {
    return null
  }
  
  // 如果id是'default'，返回null使用默认背景
  if (id === 'default') {
    return null
  }
  
  // 查找对应的背景选项
  const bg = getBackgroundById(id)
  
  // 如果找不到对应的背景，返回null使用默认背景
  if (!bg || bg.id === 'default') {
    return null
  }
  
  // 返回背景图片URL，如果url为空字符串，也返回null
  return bg.url && bg.url.trim() ? bg.url : null
}

