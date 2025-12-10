-- ============================================
-- 快速验证脚本 - 检查核心表是否存在
-- ============================================

-- 检查7个核心表
SELECT 
    CASE 
        WHEN COUNT(*) = 7 THEN '✅ 所有表已创建成功！'
        ELSE '❌ 缺少表，当前只有 ' || COUNT(*) || ' 个表'
    END as 验证结果,
    COUNT(*) as 表数量,
    string_agg(table_name, ', ' ORDER BY table_name) as 已创建的表
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
);

-- 检查4个触发器函数
SELECT 
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ 所有触发器函数已创建成功！'
        ELSE '❌ 缺少函数，当前只有 ' || COUNT(*) || ' 个函数'
    END as 验证结果,
    COUNT(*) as 函数数量,
    string_agg(routine_name, ', ' ORDER BY routine_name) as 已创建的函数
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_updated_at_column',
    'update_message_reply_count',
    'update_message_like_count',
    'update_story_draw_count'
);

