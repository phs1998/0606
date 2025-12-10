-- ============================================
-- AOI个人介绍与轻社区网站数据库初始化脚本
-- PostgreSQL建表SQL
-- ============================================

-- 扩展UUID支持
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,           -- 唯一昵称
    email VARCHAR(255) UNIQUE NOT NULL,             -- 邮箱（用于登录）
    password_hash VARCHAR(255) NOT NULL,             -- 密码哈希
    registration_number SERIAL UNIQUE NOT NULL,     -- 注册序号（自动递增）
    avatar_url VARCHAR(500),                        -- 头像URL
    is_active BOOLEAN DEFAULT TRUE,                 -- 账户是否激活
    is_admin BOOLEAN DEFAULT FALSE,                 -- 是否为管理员
    last_login_at TIMESTAMP WITH TIME ZONE,         -- 最后登录时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_registration_number ON users(registration_number);

-- ============================================
-- 2. 用户资料表 (user_profiles)
-- ============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),                      -- 显示名称
    bio TEXT,                                       -- 个人简介
    location VARCHAR(100),                          -- 所在地
    website VARCHAR(255),                           -- 个人网站
    birthday DATE,                                  -- 生日
    gender VARCHAR(20),                             -- 性别
    social_links JSONB,                            -- 社交媒体链接（JSON格式）
    custom_fields JSONB,                           -- 自定义字段（JSON格式）
    theme_color VARCHAR(7),                        -- 主题色（十六进制）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户资料表索引
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- 3. 每日故事表 (daily_stories)
-- ============================================
CREATE TABLE daily_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,                    -- 故事标题
    content TEXT NOT NULL,                          -- 故事内容
    author VARCHAR(100),                            -- 作者（可选）
    category VARCHAR(50),                          -- 分类
    rarity VARCHAR(20) DEFAULT 'common',           -- 稀有度：common, rare, epic, legendary
    image_url VARCHAR(500),                        -- 故事配图URL
    date DATE UNIQUE NOT NULL,                      -- 日期（每天一个故事）
    is_active BOOLEAN DEFAULT TRUE,                -- 是否激活
    view_count INTEGER DEFAULT 0,                  -- 查看次数
    draw_count INTEGER DEFAULT 0,                  -- 被抽中次数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 每日故事表索引
CREATE INDEX idx_daily_stories_date ON daily_stories(date);
CREATE INDEX idx_daily_stories_rarity ON daily_stories(rarity);
CREATE INDEX idx_daily_stories_category ON daily_stories(category);

-- ============================================
-- 4. 故事抽奖记录表 (story_draws)
-- ============================================
CREATE TABLE story_draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES daily_stories(id) ON DELETE CASCADE,
    draw_date DATE NOT NULL,                        -- 抽奖日期
    rarity VARCHAR(20) NOT NULL,                    -- 抽中的稀有度
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, draw_date)                     -- 每个用户每天只能抽一次
);

-- 故事抽奖记录表索引
CREATE INDEX idx_story_draws_user_id ON story_draws(user_id);
CREATE INDEX idx_story_draws_story_id ON story_draws(story_id);
CREATE INDEX idx_story_draws_draw_date ON story_draws(draw_date);
CREATE INDEX idx_story_draws_user_date ON story_draws(user_id, draw_date);

-- ============================================
-- 5. 留言表 (messages)
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,                          -- 留言内容
    is_public BOOLEAN DEFAULT TRUE,                 -- 是否公开
    is_pinned BOOLEAN DEFAULT FALSE,                -- 是否置顶
    like_count INTEGER DEFAULT 0,                  -- 点赞数
    reply_count INTEGER DEFAULT 0,                 -- 回复数
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- 父留言ID（用于回复）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 留言表索引
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_parent_message_id ON messages(parent_message_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_public ON messages(is_public);
CREATE INDEX idx_messages_is_pinned ON messages(is_pinned);

-- ============================================
-- 6. 留言点赞表 (message_likes)
-- ============================================
CREATE TABLE message_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, message_id)                    -- 每个用户对每条留言只能点赞一次
);

-- 留言点赞表索引
CREATE INDEX idx_message_likes_user_id ON message_likes(user_id);
CREATE INDEX idx_message_likes_message_id ON message_likes(message_id);

-- ============================================
-- 7. 用户会话表 (user_sessions) - 可选
-- ============================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,               -- JWT token哈希
    device_info VARCHAR(255),                       -- 设备信息
    ip_address VARCHAR(45),                         -- IP地址
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 过期时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================
-- 触发器：自动更新 updated_at 字段
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stories_updated_at BEFORE UPDATE ON daily_stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 触发器：更新留言回复数
-- ============================================
CREATE OR REPLACE FUNCTION update_message_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE messages 
        SET reply_count = reply_count + 1 
        WHERE id = NEW.parent_message_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE messages 
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE id = OLD.parent_message_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reply_count_on_insert
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.parent_message_id IS NOT NULL)
    EXECUTE FUNCTION update_message_reply_count();

CREATE TRIGGER update_reply_count_on_delete
    AFTER DELETE ON messages
    FOR EACH ROW
    WHEN (OLD.parent_message_id IS NOT NULL)
    EXECUTE FUNCTION update_message_reply_count();

-- ============================================
-- 触发器：更新留言点赞数
-- ============================================
CREATE OR REPLACE FUNCTION update_message_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE messages 
        SET like_count = like_count + 1 
        WHERE id = NEW.message_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE messages 
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.message_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_like_count_on_insert
    AFTER INSERT ON message_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_message_like_count();

CREATE TRIGGER update_like_count_on_delete
    AFTER DELETE ON message_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_message_like_count();

-- ============================================
-- 触发器：更新故事抽中次数
-- ============================================
CREATE OR REPLACE FUNCTION update_story_draw_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE daily_stories 
        SET draw_count = draw_count + 1 
        WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE daily_stories 
        SET draw_count = GREATEST(draw_count - 1, 0)
        WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_draw_count_on_insert
    AFTER INSERT ON story_draws
    FOR EACH ROW
    EXECUTE FUNCTION update_story_draw_count();

CREATE TRIGGER update_draw_count_on_delete
    AFTER DELETE ON story_draws
    FOR EACH ROW
    EXECUTE FUNCTION update_story_draw_count();

