# Cloudflare Pages 部署说明

## 问题修复

### 1. 动态路由警告
已为所有使用 `request.headers` 的 API 路由添加了 `export const dynamic = 'force-dynamic'`，这些警告现在应该消失了。

### 2. 部署命令修复

**重要**：Cloudflare Pages 需要使用 `wrangler pages deploy` 而不是 `wrangler deploy`。

#### 在 Cloudflare Pages 控制台修改部署命令：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 项目
3. 点击 **Settings** → **Builds & deployments**
4. 找到 **Build command** 部分
5. 将部署命令从：
   ```
   npx wrangler deploy
   ```
   改为：
   ```
   npx wrangler pages deploy
   ```
   或者直接留空（Cloudflare Pages 会自动处理部署）

#### 或者，如果您使用 `package.json` 脚本：

可以在 `package.json` 中添加部署脚本：

```json
{
  "scripts": {
    "deploy": "npx wrangler pages deploy"
  }
}
```

然后在 Cloudflare Pages 设置中使用：
- **Build command**: `npm run build`
- **Deploy command**: `npm run deploy`（可选，通常不需要）

## 环境变量配置

确保在 Cloudflare Pages 控制台中设置了以下环境变量：

1. 进入 **Settings** → **Environment variables**
2. 添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://fjnqqtkflfurnmhfycwe.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `JWT_SECRET`: （您的 JWT 密钥，如果使用）

## 构建配置

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/`（项目根目录）

## 注意事项

1. `wrangler.jsonc` 文件主要用于 Workers，对于 Pages 项目，环境变量应该在 Cloudflare 控制台中设置
2. 确保所有环境变量都设置了正确的值
3. 构建成功后，部署应该会自动完成


