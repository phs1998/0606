# Supabase数据库初始化指南

## 方法一：使用Supabase Dashboard SQL Editor（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query** 按钮
5. 复制 `scripts/init-db-supabase.sql` 文件中的全部内容
6. 粘贴到SQL Editor中
7. 点击 **Run** 按钮执行

## 方法二：使用Supabase CLI

如果你安装了Supabase CLI，可以使用以下命令：

```bash
# 执行SQL脚本
supabase db execute -f scripts/init-db-supabase.sql
```

## 验证表是否创建成功

执行以下查询来验证所有表是否已创建：

```sql
SELECT table_name 
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
```

应该返回7个表名。

## 验证触发器是否创建成功

执行以下查询来验证所有触发器函数是否已创建：

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_updated_at_column',
    'update_message_reply_count',
    'update_message_like_count',
    'update_story_draw_count'
)
ORDER BY routine_name;
```

应该返回4个函数名。

## 注意事项

1. **UUID生成**: Supabase使用 `gen_random_uuid()` 而不是 `uuid_generate_v4()`，脚本已适配
2. **时间戳类型**: 使用 `TIMESTAMPTZ` 替代 `TIMESTAMP WITH TIME ZONE`（两者等价，但前者更简洁）
3. **IF NOT EXISTS**: 所有CREATE语句都使用了 `IF NOT EXISTS`，可以安全地重复执行
4. **触发器**: 使用 `DROP TRIGGER IF EXISTS` 确保可以重复执行脚本

## 后续步骤

数据库初始化完成后，你可以：

1. 在Supabase Dashboard的 **Table Editor** 中查看所有表
2. 开始实现API接口（参考 `API_DESIGN.md`）
3. 配置环境变量（参考 `.env.example`）

