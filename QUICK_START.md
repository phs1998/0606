# 快速开始指南

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

创建 `.env.local` 文件（参考 `.env.example`）：

```env
# Supabase配置（从Supabase Dashboard获取）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT配置
JWT_SECRET=your-strong-random-secret-key
JWT_EXPIRES_IN=7d

# Next.js配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 如何获取Supabase配置：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（注意：此密钥有完整权限，请保密）

## 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## 4. 测试API

### 使用curl测试注册接口：

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "测试用户",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 使用curl测试登录接口：

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 使用curl测试获取当前用户（需要token）：

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. API端点列表

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户相关
- `GET /api/users/[userId]` - 获取用户信息
- `GET /api/users/profile` - 获取当前用户资料
- `PUT /api/users/profile` - 更新当前用户资料

### 留言板相关
- `GET /api/messages` - 获取留言列表
- `POST /api/messages` - 创建留言
- `GET /api/messages/[messageId]` - 获取单条留言
- `PUT /api/messages/[messageId]` - 更新留言
- `DELETE /api/messages/[messageId]` - 删除留言
- `POST /api/messages/[messageId]/like` - 点赞/取消点赞

### 故事抽奖相关
- `GET /api/stories/daily` - 获取今日故事
- `POST /api/stories/draw` - 抽奖获取故事
- `GET /api/stories/history` - 获取抽奖历史

## 6. 项目结构

```
src/
├── app/
│   └── api/              # API路由
│       ├── auth/        # 认证相关
│       ├── users/       # 用户相关
│       ├── messages/    # 留言板相关
│       └── stories/     # 故事抽奖相关
├── lib/
│   ├── supabase/        # Supabase客户端
│   ├── auth/            # 认证工具（JWT、密码加密）
│   ├── utils/           # 工具函数（验证、响应格式化）
│   └── types/           # TypeScript类型定义
```

## 7. 注意事项

1. **用户名限制**: 不超过5个汉字，只能包含汉字、字母、数字、下划线
2. **留言字数**: 最多150字
3. **每日抽奖**: 每个用户每天只能抽一次（由数据库约束保证）
4. **密码安全**: 使用bcrypt加密，最少8个字符
5. **JWT Token**: 默认有效期7天，可通过环境变量配置

## 8. 下一步开发

- [ ] 实现前端页面（登录、注册、个人主页、留言板、故事抽奖）
- [ ] 添加图片上传功能
- [ ] 实现管理员功能
- [ ] 添加更多验证和错误处理
- [ ] 实现速率限制
- [ ] 添加日志记录

## 9. 常见问题

### Q: 如何重置数据库？
A: 在Supabase Dashboard的SQL Editor中执行删除表的SQL，然后重新执行 `scripts/init-db-supabase.sql`

### Q: 如何生成强随机JWT密钥？
A: 可以使用以下命令：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Q: 如何测试需要认证的API？
A: 先调用登录接口获取token，然后在请求头中添加 `Authorization: Bearer <token>`

