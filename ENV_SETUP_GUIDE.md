# 环境变量配置指南

## 步骤1：获取Supabase配置信息

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧菜单的 **Settings** (设置)
4. 点击 **API** 选项

你会看到以下信息：

### Project URL
- 复制这个URL → 填入 `NEXT_PUBLIC_SUPABASE_URL`
- 格式类似：`https://xxxxxxxxxxxxx.supabase.co`

### API Keys
- **anon public** key → 填入 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → 填入 `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ **重要**：service_role key 拥有完整数据库权限，请保密，不要提交到Git

## 步骤2：生成JWT密钥

打开终端，运行以下命令生成强随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制生成的字符串 → 填入 `JWT_SECRET`

## 步骤3：填写 .env.local 文件

打开项目根目录下的 `.env.local` 文件，填入以下信息：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT配置
JWT_SECRET=你生成的随机密钥
JWT_EXPIRES_IN=7d

# Next.js配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 步骤4：验证配置

配置完成后，重启开发服务器：

```bash
npm run dev
```

如果配置正确，服务器应该能正常启动。

## 常见问题

### Q: 如何知道配置是否正确？
A: 启动开发服务器后，如果没有报错，说明配置基本正确。你可以尝试调用注册API测试。

### Q: service_role key 和 anon key 有什么区别？
A: 
- **anon key**: 公开密钥，用于客户端，权限受Row Level Security (RLS) 限制
- **service_role key**: 服务端密钥，拥有完整权限，仅用于服务端API

### Q: JWT_SECRET 可以随便填吗？
A: 不可以！必须使用强随机字符串。在生产环境中，如果密钥泄露，攻击者可以伪造token。

### Q: .env.local 文件需要提交到Git吗？
A: 不需要！`.env.local` 已经在 `.gitignore` 中，不会被提交。只提交 `.env.example` 作为模板。

## 安全提示

1. ✅ 永远不要将 `.env.local` 提交到Git仓库
2. ✅ 不要在生产环境使用默认的JWT_SECRET
3. ✅ 保护好 SUPABASE_SERVICE_ROLE_KEY，不要在前端代码中使用
4. ✅ 定期轮换密钥（特别是生产环境）

