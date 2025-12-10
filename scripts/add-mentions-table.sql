-- Create mentions/notifications table for @ mentions
CREATE TABLE IF NOT EXISTS mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 被@的用户
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- @他人的用户
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- 关联的帖子（如果是在帖子中@）
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 关联的评论（如果是在评论中@）
    content TEXT NOT NULL, -- @的内容（帖子或评论的内容）
    is_read BOOLEAN DEFAULT FALSE, -- 是否已读
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_from_user_id ON mentions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_post_id ON mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_mentions_comment_id ON mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_mentions_is_read ON mentions(is_read);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON mentions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_user_read ON mentions(user_id, is_read);





















