-- Add notification_type field to mentions table
ALTER TABLE mentions 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(20) DEFAULT 'mention';

-- Add article_id field for article replies
ALTER TABLE mentions 
ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES articles(id) ON DELETE CASCADE;

-- Create index for article_id
CREATE INDEX IF NOT EXISTS idx_mentions_article_id ON mentions(article_id);

-- Update notification_type constraint (mention, post_reply, article_reply, comment_reply)
-- Note: PostgreSQL doesn't support CHECK constraints easily, so we'll handle this in application logic













