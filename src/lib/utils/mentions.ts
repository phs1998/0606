/**
 * Extract @mentions from text content
 * Matches @username patterns (e.g., @username, @user_name, @user123)
 */
export function extractMentions(content: string): string[] {
  if (!content) return []

  // Match @username patterns
  // Username can contain letters, numbers, underscores, and Chinese characters
  const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  const matches = content.matchAll(mentionRegex)
  const usernames = new Set<string>()

  for (const match of matches) {
    const username = match[1]
    if (username) {
      usernames.add(username)
    }
  }

  return Array.from(usernames)
}





















