# 注册功能快速修复指南

## 立即执行的步骤

### 步骤 1：检查 Vercel 环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 **aoi.io**
3. 进入 **Settings** → **Environment Variables**
4. 确认以下变量已设置（至少 Production 环境）：

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY  ← 这个最重要！
✅ JWT_SECRET
```

### 步骤 2：获取 Supabase Service Role Key

如果 `SUPABASE_SERVICE_ROLE_KEY` 未设置：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 找到 **service_role** key（⚠️ 注意：不是 anon key）
5. 复制这个 key
6. 在 Vercel 中添加为 `SUPABASE_SERVICE_ROLE_KEY`

### 步骤 3：提交并推送代码

```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "修复注册功能：改进错误处理和 Cookie 设置"

# 推送到远程仓库（这会自动触发 Vercel 重新部署）
git push origin main
```

### 步骤 4：重新部署（如果环境变量已更改）

如果刚刚添加或修改了环境变量：

1. 在 Vercel Dashboard 中进入项目
2. 点击 **Deployments** 标签
3. 找到最新的部署
4. 点击右侧 **⋯** → **Redeploy**

### 步骤 5：验证修复

部署完成后（通常需要 1-2 分钟）：

1. 访问 https://aoi.io
2. 尝试注册一个新账号
3. 如果仍然失败，查看 Vercel 日志：
   - 进入 **Deployments** → 最新部署 → **Functions** → `/api/auth/register`
   - 查看错误日志

## 常见问题快速解决

### 问题：仍然返回 500 错误

**检查清单：**

1. ✅ `SUPABASE_SERVICE_ROLE_KEY` 已设置（不是 anon key）
2. ✅ 所有环境变量都已保存
3. ✅ 已触发新的部署（环境变量更改后必须重新部署）
4. ✅ Supabase 数据库表 `users` 和 `user_profiles` 已创建

### 问题：环境变量在哪里设置？

**Vercel Dashboard** → 你的项目 → **Settings** → **Environment Variables**

### 问题：如何查看错误日志？

**Vercel Dashboard** → 你的项目 → **Deployments** → 点击部署 → **Functions** → 找到 `/api/auth/register` → 查看日志

### 问题：如何知道部署是否完成？

在 Vercel Dashboard 的 **Deployments** 页面，部署状态会显示：
- 🟡 **Building** - 正在构建
- 🟡 **Deploying** - 正在部署
- 🟢 **Ready** - 部署完成

## 测试命令

部署完成后，可以使用以下命令测试：

```bash
curl -X POST https://aoi.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

如果成功，应该返回：
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

## 需要帮助？

如果问题仍然存在，请提供：
1. Vercel 函数日志中的错误信息
2. 浏览器控制台的错误信息
3. 确认环境变量是否都已设置





