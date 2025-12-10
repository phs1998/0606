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

### 推荐配置（使用 Cloudflare Next.js 适配器）

在 Cloudflare Pages 控制台的 **Settings** → **Builds & deployments** 中配置：

- **Framework preset**: None（或 Next.js）
- **Build command**: `npm run build:cloudflare`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: **留空**（不要填写任何内容，包括 `/`）
- **Deploy command**: 
  - **如果允许留空**：留空
  - **如果不允许留空**：使用 `echo "Deploy handled by Cloudflare Pages"` 或 `true`

**重要**：
- Root directory 字段必须**留空**，不要填写 `/` 或其他路径。Cloudflare Pages 会自动使用仓库根目录。
- 项目根目录已包含 `.npmrc` 文件，配置了 `legacy-peer-deps=true`，这样 Cloudflare Pages 在运行 `npm clean-install` 时会自动使用 `--legacy-peer-deps` 标志，解决依赖版本冲突问题。

### 备选配置（标准 Next.js 构建）

如果适配器方案有问题，可以尝试：

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: **留空**（不要填写任何内容）
- **Deploy command**: 
  - **如果允许留空**：留空
  - **如果不允许留空**：使用 `echo "Deploy handled by Cloudflare Pages"` 或 `true`

**重要**：Root directory 字段必须**留空**，不要填写 `/` 或其他路径。

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

### 4. "Failed: root directory not found" 错误

**原因**：在 Cloudflare Pages 控制台的 **Root directory** 字段中填写了错误的路径（如 `/` 或其他不存在的路径）。

**解决方案**：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → 项目 **0606**
3. 点击 **Settings** → **Builds & deployments**
4. 找到 **Root directory** 字段
5. **将该字段完全清空**（不要填写 `/` 或任何其他路径）
6. 保存设置
7. 重新触发部署

**重要**：Root directory 字段应该**留空**，Cloudflare Pages 会自动使用 Git 仓库的根目录。

### 5. Deploy command 字段不能留空

**原因**：Cloudflare Pages 可能要求该字段必须有值。

**解决方案**：
使用以下任一命令（这些命令不会执行任何操作，只是返回成功）：
- `echo "Deploy handled by Cloudflare Pages"`
- `true`
- `:`

这些命令会立即返回成功（退出码 0），不会执行任何实际部署操作，因为 Cloudflare Pages 会在构建完成后自动处理部署。

### 6. "@cloudflare/next-on-pages" 版本不存在错误

**原因**：`package.json` 中指定的版本号不存在。

**解决方案**：
- 已更新为正确的版本号：`@cloudflare/next-on-pages@^1.13.16`
- 如果将来需要更新，可以运行 `npm view @cloudflare/next-on-pages versions` 查看可用版本

### 7. Next.js 版本不兼容错误

**原因**：`@cloudflare/next-on-pages@1.13.16` 需要 Next.js `>=14.3.0 && <=15.5.2`，但 Next.js 14.3.0 只有 canary 版本，没有稳定版本。

**解决方案**：
- 使用 `@cloudflare/next-on-pages@1.12.1`，该版本与 Next.js 14.2.x 兼容
- Next.js 保持在 `^14.2.0`（使用最新的 14.2.33 稳定版本）
- `eslint-config-next` 保持在 `^14.2.0`（与 Next.js 14.2.x 匹配）
- 已在项目根目录创建 `.npmrc` 文件，配置了 `legacy-peer-deps=true`
- 这样 Cloudflare Pages 在运行 `npm clean-install` 时会自动使用 `--legacy-peer-deps` 标志，解决依赖版本冲突问题
- 构建命令可以简化为 `npm run build:cloudflare`，因为依赖安装会自动使用 `.npmrc` 配置

### 8. 部署后显示 "Hello World" 而不是 Next.js 应用

**原因**：Cloudflare Pages 没有正确识别 Next.js 应用，需要使用 Cloudflare Next.js 适配器。

**解决方案**：

#### 方案 A：使用 Cloudflare Next.js 适配器（推荐）

1. **已安装适配器**：项目已配置 `@cloudflare/next-on-pages@^1.13.16`（最新稳定版本）

2. **更新 Cloudflare Pages 构建配置**：
   在 Cloudflare Pages 控制台的 **Settings** → **Builds & deployments** 中：
   - **Build command**: `npm run build:cloudflare`
   - **Build output directory**: `.vercel/output/static`
   - **Framework preset**: None（或 Next.js）

3. **确保 functions/_routes.json 存在**：
   已在项目根目录创建 `functions/_routes.json`：
   ```json
   {
     "version": 1,
     "include": ["/*"],
     "exclude": ["/static/*"]
   }
   ```

4. **重新部署**：
   - 提交更改到 Git 仓库
   - Cloudflare Pages 会自动重新构建和部署

#### 方案 B：如果方案 A 不工作，尝试标准 Next.js 构建

如果适配器方案有问题，可以尝试：

1. **在 Cloudflare Pages 控制台配置**：
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Framework preset**: Next.js

2. **确保 functions/_routes.json 存在**（已创建）

3. **检查并删除冲突的 index.html**：
   - 检查项目根目录下是否有 `index.html`，如果有请删除
   - 检查 `public/` 目录下是否有 `index.html`，如果有也请移除

## 注意事项

1. **Git 集成是推荐方式**：连接 GitHub/GitLab 仓库后，每次推送代码都会自动构建和部署
2. **环境变量优先级**：Cloudflare Dashboard 中设置的环境变量会覆盖 `wrangler.jsonc` 中的 `vars`
3. **构建输出**：确保 `next build` 成功生成 `.next` 目录
4. **不需要部署命令**：使用 Git 集成时，Cloudflare 会自动处理部署




