# Cloudflare Pages 部署说明

## 问题修复

### 1. 动态路由警告
已为所有使用 `request.headers` 的 API 路由添加了 `export const dynamic = 'force-dynamic'`，这些警告现在应该消失了。

### 2. wrangler.jsonc 配置修复

**重要**：`pages_build` 不是 `wrangler.jsonc` 的有效配置项。对于 Cloudflare Pages，只需要 `pages_build_output_dir`。

当前 `wrangler.jsonc` 配置：
```jsonc
{
  "$schema": "https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/config-schema.json",
  "name": "0606",
  "compatibility_date": "2025-12-10",
  "pages_build_output_dir": ".next",
  "vars": {
    "NEXT_PUBLIC_SUPABASE_URL": "...",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "..."
  }
}
```

**注意**：`vars` 字段主要用于 Workers。对于 Pages 项目，环境变量应该在 Cloudflare Dashboard 中设置。

### 3. 部署命令配置（Git 集成自动部署）

**重要**：如果使用 Git 集成自动部署，**不应该**有部署命令。Cloudflare Pages 会在构建完成后自动部署。

#### 在 Cloudflare Pages 控制台配置：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → 项目 **0606**
3. 点击 **Settings** → **Builds & deployments**
4. 配置如下：
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Deploy command**: 
     - **如果允许留空**：留空（不要设置任何部署命令）
     - **如果不允许留空**：使用 `echo "Deploy handled by Cloudflare Pages"` 或 `true`（这些命令不会执行任何操作，只是返回成功）

#### 如果必须使用手动部署（不推荐）：

只有在不使用 Git 集成时才需要手动部署命令。如果必须使用，需要：

1. 确保 API Token 有正确权限：
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **My Profile** → **API Tokens**
   - 创建或编辑 Token，确保有 **Cloudflare Pages:Edit** 权限
   - 在构建环境中设置 `CLOUDFLARE_API_TOKEN` 环境变量

2. 在 Cloudflare Pages 设置中：
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler pages deploy --project-name=0606`

## 环境变量配置

**重要**：环境变量必须在 Cloudflare Pages 控制台中设置，而不是在 `wrangler.jsonc` 的 `vars` 中。

### 在 Cloudflare Pages 控制台设置环境变量：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → 项目 **0606**
3. 点击 **Settings** → **Environment variables**
4. 为 **Production** 环境添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://fjnqqtkflfurnmhfycwe.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbnFxdGtmbGZ1cm5taGZ5Y3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzU3NjUsImV4cCI6MjA4MDc1MTc2NX0.Hs3IQW0KrEOQSNGDjwcjey5CR9Je0DbGsqrdtKvaCuo`
   - `JWT_SECRET`: （您的 JWT 密钥，如果使用）
   - `SUPABASE_SERVICE_ROLE_KEY`: （如果需要，用于服务端操作）

5. 如果需要，也可以为 **Preview** 环境设置相同的变量

## 构建配置

在 Cloudflare Pages 控制台的 **Settings** → **Builds & deployments** 中配置：

- **Framework preset**: Next.js（或 None）
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/`（项目根目录）
- **Deploy command**: 
  - **如果允许留空**：留空
  - **如果不允许留空**：使用 `echo "Deploy handled by Cloudflare Pages"` 或 `true`

## 常见问题

### 1. 认证错误 [code: 10000]

**原因**：如果使用部署命令，API Token 权限不足。

**解决方案**：
- **推荐**：移除部署命令，使用 Git 集成自动部署
- **备选**：确保 API Token 有 **Cloudflare Pages:Edit** 权限

### 2. "Unexpected fields found: pages_build"

**原因**：`pages_build` 不是 `wrangler.jsonc` 的有效配置项。

**解决方案**：已从 `wrangler.jsonc` 中移除该配置。

### 3. 构建成功但部署失败

**原因**：通常是因为设置了不必要的部署命令。

**解决方案**：
- 移除部署命令（如果允许）
- 如果 Deploy command 字段不能留空，使用无害命令：`echo "Deploy handled by Cloudflare Pages"` 或 `true`
- 确保构建输出目录正确设置为 `.next`
- Cloudflare Pages 会在构建完成后自动部署

### 4. Deploy command 字段不能留空

**原因**：Cloudflare Pages 可能要求该字段必须有值。

**解决方案**：
使用以下任一命令（这些命令不会执行任何操作，只是返回成功）：
- `echo "Deploy handled by Cloudflare Pages"`
- `true`
- `:`

这些命令会立即返回成功（退出码 0），不会执行任何实际部署操作，因为 Cloudflare Pages 会在构建完成后自动处理部署。

### 5. 部署后显示 "Hello World" 而不是 Next.js 应用

**原因**：Cloudflare Pages 没有正确识别 Next.js 应用的路由，可能因为：
- 根目录或 `public/` 目录下有 `index.html` 文件覆盖了 Next.js 路由
- 缺少 `functions/_routes.json` 配置文件

**解决方案**：

1. **检查并删除冲突的 index.html**：
   - 检查项目根目录下是否有 `index.html`，如果有请删除或重命名（如 `index.html.bak`）
   - 检查 `public/` 目录下是否有 `index.html`，如果有也请移除

2. **创建 functions/_routes.json 配置**：
   在项目根目录下创建 `functions` 文件夹（如果不存在），然后在其中创建 `_routes.json` 文件：
   ```json
   {
     "version": 1,
     "include": ["/*"],
     "exclude": ["/static/*"]
   }
   ```
   
   这个配置文件告诉 Cloudflare Pages：
   - `"include": ["/*"]`：所有请求都由 Next.js 应用处理
   - `"exclude": ["/static/*"]`：排除静态资源路径，提升性能

3. **重新部署**：
   - 提交更改到 Git 仓库
   - Cloudflare Pages 会自动重新构建和部署
   - 或者手动触发重新部署

## 注意事项

1. **Git 集成是推荐方式**：连接 GitHub/GitLab 仓库后，每次推送代码都会自动构建和部署
2. **环境变量优先级**：Cloudflare Dashboard 中设置的环境变量会覆盖 `wrangler.jsonc` 中的 `vars`
3. **构建输出**：确保 `next build` 成功生成 `.next` 目录
4. **不需要部署命令**：使用 Git 集成时，Cloudflare 会自动处理部署




