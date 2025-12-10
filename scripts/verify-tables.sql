-- ============================================
-- 验证数据库表是否创建成功
-- 在Supabase Dashboard的SQL Editor中执行此脚本
-- ============================================

-- 1. 检查所有表是否存在
SELECT 
    '表检查' as 检查项,
    table_name as 表名,
    CASE 
        WHEN table_name IN ('users', 'user_profiles', 'daily_stories', 'story_draws', 'messages', 'message_likes', 'user_sessions')
        THEN '✅ 已创建'
        ELSE '❌ 未找到'
    END as 状态
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users',
    'user_profiles',
    'daily_stories',
    'story_draws',
    'messages',
    'message_likes',
    'user_sessions'
)
ORDER BY table_name;

-- 2. 检查触发器函数是否存在
SELECT 
    '触发器函数检查' as 检查项,
    routine_name as 函数名,
    '✅ 已创建' as 状态
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_updated_at_column',
    'update_message_reply_count',
    'update_message_like_count',
    'update_story_draw_count'
)
ORDER BY routine_name;

-- 3. 检查触发器是否已创建
SELECT 
    '触发器检查' as 检查项,
    event_object_table as 表名,
    trigger_name as 触发器名,
    event_manipulation as 事件类型,
    '✅ 已创建' as 状态
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN (
    'users',
    'user_profiles',
    'daily_stories',
    'story_draws',
    'messages',
    'message_likes'
)
ORDER BY event_object_table, trigger_name;

-- 4. 检查索引是否已创建（部分重要索引）
SELECT 
    '索引检查' as 检查项,
    tablename as 表名,
    indexname as 索引名,
    '✅ 已创建' as 状态
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'users',
    'user_profiles',
    'daily_stories',
    'story_draws',
    'messages',
    'message_likes',
    'user_sessions'
)
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 5. 检查表结构（users表示例）
SELECT 
    '表结构检查 (users)' as 检查项,
    column_name as 字段名,
    data_type as 数据类型,
    is_nullable as 可空,
    column_default as 默认值
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 6. 检查外键约束
SELECT
    '外键检查' as 检查项,
    tc.table_name as 表名,
    kcu.column_name as 字段名,
    ccu.table_name AS 引用表,
    ccu.column_name AS 引用字段,
    '✅ 已创建' as 状态
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
    'user_profiles',
    'story_draws',
    'messages',
    'message_likes',
    'user_sessions'
)
ORDER BY tc.table_name, kcu.column_name;

-- 7. 统计信息汇总
SELECT 
    '汇总统计' as 检查项,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'user_profiles', 'daily_stories', 'story_draws', 'messages', 'message_likes', 'user_sessions')) as 表数量,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('update_updated_at_column', 'update_message_reply_count', 'update_message_like_count', 'update_story_draw_count')) as 函数数量,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND event_object_table IN ('users', 'user_profiles', 'daily_stories', 'story_draws', 'messages', 'message_likes')) as 触发器数量;

