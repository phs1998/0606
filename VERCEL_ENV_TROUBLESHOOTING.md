# Vercel 环境变量配置故障排除指南

## 问题症状

- 注册功能返回 500 错误，提示"服务器配置错误"
- 登录功能正常工作
- 部署日志显示构建成功

## 可能的原因

### 1. 环境变量未配置到 Production 环境

**问题**：在 Vercel 中，环境变量可以分别配置到 Production、Preview 和 Development 环境。如果只配置了 Preview 或 Development，生产环境将无法访问这些变量。

**解决方法**：
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **Environment Variables**
4. 检查每个环境变量是否勾选了 **Production** 环境
5. 如果没有勾选，请勾选并保存
6. **重要**：配置后需要重新部署才能生效

### 2. 环境变量名称拼写错误

**必需的环境变量**（注意大小写）：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`（推荐，但不是必需的）

**检查方法**：
1. 在 Vercel Dashboard 中查看环境变量列表
2. 确保名称完全匹配（包括大小写）
3. 注意不要有多余的空格

### 3. 环境变量值有问题

**常见问题**：
- 值中包含多余的空格或换行符
- 值被截断（复制时没有完整复制）
- 使用了占位符值（如 `placeholder-key-for-build`）

**检查方法**：
1. 在 Vercel 中编辑环境变量
2. 确保值完整且没有多余字符
3. 重新复制并粘贴值

### 4. 需要重新部署

**问题**：在 Vercel 中修改环境变量后，需要重新部署才能生效。

**解决方法**：
1. 在 Vercel Dashboard 中，进入 **Deployments** 页面
2. 点击最新的部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 或者推送新的代码到 Git 仓库触发自动部署

## 验证环境变量配置

### 方法1：查看 Vercel 函数日志

1. 在 Vercel Dashboard 中，进入 **Deployments**
2. 点击最新的部署
3. 查看 **Functions** 标签页
4. 点击 `/api/auth/register` 函数
5. 查看日志输出，应该能看到环境变量检查的结果

### 方法2：添加临时调试端点

可以创建一个临时的调试端点来检查环境变量：

```typescript
// src/app/api/debug/env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'N/A'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      JWT_SECRET: {
        exists: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length || 0,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      },
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }
  })
}
```

访问 `https://your-domain.vercel.app/api/debug/env` 查看环境变量状态。

**注意**：调试完成后，请删除此端点，因为它会暴露环境变量的部分信息。

## 正确的环境变量配置步骤

### 1. 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. 生成 JWT 密钥

在本地运行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制生成的字符串 → `JWT_SECRET`

### 3. 在 Vercel 中配置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **Environment Variables**
4. 添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = 你的 service_role key
   - `JWT_SECRET` = 你生成的 JWT 密钥
5. **重要**：确保每个变量都勾选了 **Production**、**Preview** 和 **Development**
6. 点击 **Save**

### 4. 重新部署

1. 进入 **Deployments** 页面
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 等待部署完成

## 为什么登录正常但注册失败？

登录 API 没有进行环境变量检查，所以即使环境变量未配置，登录功能也可能看起来"正常"（但实际上可能也有问题）。注册 API 有严格的环境变量检查，所以会立即暴露配置问题。

## 联系支持

如果按照以上步骤操作后问题仍然存在，请：

1. 检查 Vercel 函数日志中的详细错误信息
2. 确认所有环境变量都已正确配置到 Production 环境
3. 确认已经重新部署
4. 如果问题仍然存在，请提供：
   - Vercel 函数日志
   - 环境变量配置截图（隐藏实际值）
   - 错误响应详情

