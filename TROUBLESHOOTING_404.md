# 注册功能 404 错误排查指南

## 问题描述

注册功能返回 404 错误，显示"服务器配置错误"。

## 可能的原因

### 1. 路由文件未正确部署

**检查方法：**
1. 在 Vercel Dashboard 中进入项目
2. 查看 **Deployments** → 最新部署 → **Build Logs**
3. 检查是否有关于 `/api/auth/register` 的错误

**解决方案：**
- 确保 `src/app/api/auth/register/route.ts` 文件存在
- 确保文件已提交到 Git 仓库
- 重新部署项目

### 2. 环境变量未正确设置

**检查方法：**
1. 在 Vercel Dashboard 中进入项目
2. 进入 **Settings** → **Environment Variables**
3. 确认以下变量已设置（至少 Production 环境）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`（推荐）

**解决方案：**
- 添加缺失的环境变量
- 确保环境变量名称拼写正确（区分大小写）
- 确保环境变量值没有多余的空格
- **重要**：添加或修改环境变量后，必须重新部署才能生效

### 3. Next.js 构建问题

**检查方法：**
查看 Vercel 构建日志，检查是否有编译错误。

**解决方案：**
- 修复所有 TypeScript/编译错误
- 确保所有依赖已正确安装
- 重新部署

### 4. Vercel 路由配置问题

**检查方法：**
检查是否有 `vercel.json` 或其他路由配置文件。

**解决方案：**
- 确保没有自定义路由配置覆盖了 API 路由
- 如果使用 `vercel.json`，确保配置正确

## 立即执行的步骤

### 步骤 1：检查 Vercel 环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 **aoi.io**
3. 进入 **Settings** → **Environment Variables**
4. 确认以下变量已设置（至少 Production 环境）：

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ JWT_SECRET
✅ SUPABASE_SERVICE_ROLE_KEY (推荐)
```

### 步骤 2：检查构建日志

1. 在 Vercel Dashboard 中进入项目
2. 进入 **Deployments**
3. 点击最新的部署
4. 查看 **Build Logs**
5. 查找任何关于 `/api/auth/register` 的错误

### 步骤 3：检查函数日志

1. 在 Vercel Dashboard 中进入项目
2. 进入 **Deployments**
3. 点击最新的部署
4. 进入 **Functions** 标签
5. 查找 `/api/auth/register` 函数
6. 查看日志输出

### 步骤 4：测试 API 端点

使用 curl 直接测试 API：

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

`-v` 参数会显示详细的响应信息，包括 HTTP 状态码。

### 步骤 5：重新部署

如果修改了环境变量或代码：

1. 提交代码到 Git：
   ```bash
   git add .
   git commit -m "修复注册功能"
   git push origin main
   ```

2. 或者在 Vercel Dashboard 中手动重新部署：
   - 进入 **Deployments**
   - 找到最新部署
   - 点击 **⋯** → **Redeploy**

## 调试技巧

### 1. 查看浏览器控制台

打开浏览器开发者工具（F12），查看：
- **Console** 标签：查看 JavaScript 错误
- **Network** 标签：查看 API 请求和响应

### 2. 查看 Vercel 实时日志

在 Vercel Dashboard 中：
1. 进入项目
2. 进入 **Functions** 标签
3. 找到 `/api/auth/register`
4. 查看实时日志

### 3. 添加调试日志

如果问题仍然存在，可以在代码中添加更多日志：

```typescript
export async function POST(request: NextRequest) {
  console.log('注册请求收到:', {
    url: request.url,
    method: request.method,
    hasBody: !!request.body,
  })
  
  // ... 其余代码
}
```

## 常见错误信息

### "服务器配置错误：缺少必需的环境变量"

**原因**：环境变量未设置或未正确设置

**解决**：
1. 在 Vercel 中检查环境变量
2. 确保所有必需的环境变量都已设置
3. 重新部署

### 404 Not Found

**原因**：
- 路由文件不存在
- 路由未正确部署
- Next.js 构建时排除了该路由

**解决**：
1. 确认路由文件存在
2. 检查构建日志
3. 重新部署

### 500 Internal Server Error

**原因**：
- 服务器端错误
- 数据库连接问题
- 代码执行错误

**解决**：
1. 查看 Vercel 函数日志
2. 检查错误详情
3. 修复代码问题

## 验证修复

修复后，使用以下方法验证：

1. **浏览器测试**：
   - 访问 https://aoi.io
   - 尝试注册新账号
   - 检查是否成功

2. **API 测试**：
   ```bash
   curl -X POST https://aoi.io/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **检查响应**：
   - 成功应该返回 200 状态码和用户信息
   - 失败应该返回相应的错误码和错误信息（不是 404）

## 需要帮助？

如果问题仍然存在，请提供：
1. Vercel 构建日志
2. Vercel 函数日志
3. 浏览器控制台错误信息
4. curl 测试的完整输出





