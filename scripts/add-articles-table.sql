-- Create articles table for user-created articles
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL, -- 文章标题
    content TEXT NOT NULL, -- 文章内容（最多1500字）
    like_count INTEGER DEFAULT 0, -- 点赞数
    comment_count INTEGER DEFAULT 0, -- 评论数
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);

-- Create article_likes table (similar to post_likes)
CREATE TABLE IF NOT EXISTS article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);

-- Create article_comments table (similar to comments)
CREATE TABLE IF NOT EXISTS article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent_comment_id ON article_comments(parent_comment_id);














