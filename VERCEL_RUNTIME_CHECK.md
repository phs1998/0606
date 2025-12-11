# Vercel 运行时检查指南

## 构建状态

从构建日志可以看到：
- ✅ 构建成功完成
- ✅ `/api/auth/register` 路由已正确识别（显示为 `ƒ /api/auth/register`）
- ✅ 所有路由都已正确构建

## 404 错误的可能原因

由于构建成功，404 错误可能是运行时问题：

### 1. 环境变量未正确设置（最可能）

**检查方法：**
1. 在 Vercel Dashboard 中进入项目
2. 进入 **Settings** → **Environment Variables**
3. 确认以下变量已设置（至少 Production 环境）：
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   JWT_SECRET
   SUPABASE_SERVICE_ROLE_KEY (推荐)
   ```

**重要提示：**
- 环境变量名称必须完全匹配（区分大小写）
- 环境变量值不能有多余的空格
- 修改环境变量后必须重新部署

### 2. 运行时错误导致路由无法响应

**检查方法：**
1. 在 Vercel Dashboard 中进入项目
2. 进入 **Deployments** → 最新部署
3. 进入 **Functions** 标签
4. 找到 `/api/auth/register` 函数
5. 查看实时日志

**常见运行时错误：**
- 环境变量缺失导致模块加载失败
- Supabase 连接失败
- 代码执行错误

## 立即执行的步骤

### 步骤 1：验证环境变量

在 Vercel Dashboard 中检查环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 确认以下变量存在且值不为空：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`（推荐）

### 步骤 2：查看函数日志

1. 在 Vercel Dashboard 中进入项目
2. 进入 **Deployments** → 最新部署
3. 进入 **Functions** 标签
4. 找到 `/api/auth/register`
5. 尝试注册一个账号（触发函数执行）
6. 查看日志输出

### 步骤 3：测试 API 端点

使用 curl 直接测试：

```bash
curl -X POST https://aoi.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }' \
  -v
```

查看响应：
- 如果返回 404：路由未找到
- 如果返回 500：服务器错误（查看日志）
- 如果返回 400/409：业务逻辑错误（正常）

### 步骤 4：检查浏览器网络请求

1. 打开 https://aoi.io
2. 打开浏览器开发者工具（F12）
3. 进入 **Network** 标签
4. 尝试注册
5. 查看 `/api/auth/register` 请求：
   - **Status Code**：应该是 200、400、409 或 500，不应该是 404
   - **Response**：查看响应内容
   - **Request URL**：确认 URL 正确

## 调试技巧

### 1. 添加调试日志

如果问题仍然存在，可以在注册路由中添加更多日志：

```typescript
export async function POST(request: NextRequest) {
  console.log('=== 注册请求开始 ===')
  console.log('Request URL:', request.url)
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
  
  // ... 其余代码
}
```

### 2. 检查 Vercel 函数配置

确认 Vercel 没有自定义路由配置覆盖了 API 路由。

### 3. 验证路由文件结构

确认文件结构正确：
```
src/app/api/auth/register/route.ts
```

## 常见问题

### Q: 为什么构建成功但运行时返回 404？

A: 可能的原因：
1. 环境变量缺失导致模块加载失败
2. 运行时错误导致路由无法响应
3. Vercel 路由配置问题

### Q: 如何确认环境变量已正确设置？

A: 
1. 在 Vercel Dashboard 中检查
2. 查看函数日志中的环境变量检查输出
3. 使用调试日志验证

### Q: 环境变量修改后需要做什么？

A: **必须重新部署**才能生效。可以：
1. 推送新的代码提交（自动触发部署）
2. 在 Vercel Dashboard 中手动重新部署

## 下一步

如果问题仍然存在：

1. 查看 Vercel 函数日志获取详细错误信息
2. 使用 curl 测试 API 端点
3. 检查浏览器网络请求详情
4. 提供具体的错误信息以便进一步排查





