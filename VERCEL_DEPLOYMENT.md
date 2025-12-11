# Vercel 部署指南

## 部署步骤

### 1. 准备代码

确保所有更改已提交到 Git 仓库：

```bash
git add .
git commit -m "修复注册功能"
git push origin main
```

### 2. 配置 Vercel 环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（aoi.io）
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

#### 必需的环境变量

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

#### 可选的环境变量

```
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=https://aoi.io
```

### 3. 环境变量配置说明

#### 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **重要**

#### 生成 JWT_SECRET

在本地运行：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制生成的字符串作为 `JWT_SECRET`。

### 4. 设置环境变量作用域

在 Vercel 中，为每个环境变量设置作用域：
- **Production** - 生产环境（aoi.io）
- **Preview** - 预览环境（可选）
- **Development** - 开发环境（可选）

**重要**：确保所有环境变量都至少设置了 **Production** 作用域。

### 5. 重新部署

配置完环境变量后，有两种方式触发重新部署：

#### 方式 1：自动部署（推荐）

如果你已经连接了 Git 仓库，推送新的提交会自动触发部署：

```bash
git push origin main
```

#### 方式 2：手动重新部署

1. 在 Vercel Dashboard 中进入你的项目
2. 点击 **Deployments** 标签
3. 找到最新的部署记录
4. 点击右侧的 **⋯** 菜单
5. 选择 **Redeploy**

### 6. 验证部署

部署完成后，访问 https://aoi.io 并测试注册功能。

## 故障排查

### 问题 1：注册返回 500 错误

**可能原因：**
1. 环境变量未正确配置
2. `SUPABASE_SERVICE_ROLE_KEY` 未设置
3. Supabase RLS 策略阻止插入

**解决方案：**

1. **检查环境变量**：
   - 在 Vercel Dashboard 中确认所有环境变量都已设置
   - 确保环境变量名称拼写正确（区分大小写）
   - 确保环境变量值没有多余的空格

2. **检查 Supabase 配置**：
   - 确认 `SUPABASE_SERVICE_ROLE_KEY` 已设置（不是 anon key）
   - 在 Supabase Dashboard 中检查 RLS 策略

3. **查看 Vercel 日志**：
   - 在 Vercel Dashboard 中进入 **Deployments**
   - 点击失败的部署
   - 查看 **Functions** 标签中的日志
   - 查找错误信息

### 问题 2：Cookie 未设置

**可能原因：**
- `secure` 标志在 HTTPS 环境下必须为 `true`

**解决方案：**
代码已自动处理，在 Vercel 生产环境中 `secure` 会自动设置为 `true`。

### 问题 3：数据库权限错误

**可能原因：**
- 使用 anon key 而不是 service role key
- RLS 策略未正确配置

**解决方案：**

1. **使用 Service Role Key**（推荐）：
   - 在 Vercel 中设置 `SUPABASE_SERVICE_ROLE_KEY`
   - Service role key 拥有完整权限，可以绕过 RLS

2. **配置 RLS 策略**（如果必须使用 anon key）：
   在 Supabase Dashboard 的 SQL Editor 中执行：

   ```sql
   -- 允许匿名用户插入到 users 表
   CREATE POLICY "Allow anonymous insert" ON users
     FOR INSERT
     TO anon
     WITH CHECK (true);

   -- 允许匿名用户插入到 user_profiles 表
   CREATE POLICY "Allow anonymous insert" ON user_profiles
     FOR INSERT
     TO anon
     WITH CHECK (true);
   ```

   ⚠️ **注意**：这种方法安全性较低，建议使用 service role key。

### 问题 4：环境变量在构建时未生效

**可能原因：**
- 环境变量未正确设置
- 需要重新部署

**解决方案：**
1. 确认环境变量已保存
2. 触发新的部署（推送代码或手动重新部署）
3. 环境变量更改后必须重新部署才能生效

## 检查清单

部署前请确认：

- [ ] 所有环境变量已设置（至少 Production 环境）
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已设置（不是 anon key）
- [ ] `JWT_SECRET` 已设置（强随机字符串）
- [ ] Supabase 数据库表已创建（users, user_profiles）
- [ ] 代码已提交并推送到 Git 仓库
- [ ] Vercel 已连接到正确的 Git 仓库
- [ ] 部署完成后测试注册功能

## 测试注册功能

部署完成后，使用以下方法测试：

### 方法 1：浏览器测试

1. 访问 https://aoi.io
2. 点击注册
3. 填写注册信息
4. 提交表单
5. 检查是否成功

### 方法 2：使用 curl 测试

```bash
curl -X POST https://aoi.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 方法 3：查看 Vercel 日志

如果注册失败，在 Vercel Dashboard 中查看函数日志：
1. 进入 **Deployments**
2. 点击最新的部署
3. 点击 **Functions** 标签
4. 找到 `/api/auth/register` 函数
5. 查看日志输出

## 常见错误信息

### "服务器配置错误，请稍后重试" (CONFIG_ERROR)
- **原因**：缺少必需的环境变量
- **解决**：检查 Vercel 环境变量配置

### "注册失败，请稍后重试" (DATABASE_ERROR)
- **原因**：数据库操作失败
- **解决**：检查 Supabase 连接和 RLS 策略

### "数据库权限错误，请联系管理员" (PERMISSION_ERROR)
- **原因**：RLS 策略阻止操作
- **解决**：设置 `SUPABASE_SERVICE_ROLE_KEY` 或配置 RLS 策略

### "用户名已存在" (USERNAME_EXISTS) / "邮箱已被注册" (EMAIL_EXISTS)
- **原因**：这是正常的业务逻辑错误
- **解决**：使用不同的用户名或邮箱

## 联系支持

如果问题仍然存在：

1. 查看 Vercel 函数日志获取详细错误信息
2. 检查 Supabase Dashboard 中的数据库日志
3. 确认所有环境变量配置正确
4. 尝试在本地环境测试（使用相同的环境变量）





