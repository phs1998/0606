# API实现说明文档

## 已实现的API接口

### 一、认证相关 API

#### 1. 用户注册
- **路径**: `POST /api/auth/register`
- **功能**: 注册新用户，自动分配唯一昵称和注册序号
- **请求体**:
```json
{
  "username": "用户名（不超过5个汉字）",
  "email": "user@example.com",
  "password": "password123"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "用户名",
      "email": "user@example.com",
      "registration_number": 1,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token"
  }
}
```
- **验证规则**:
  - 用户名：不超过5个汉字，只能包含汉字、字母、数字、下划线
  - 邮箱：必须为有效邮箱格式
  - 密码：至少8个字符
  - 用户名和邮箱必须唯一

#### 2. 用户登录
- **路径**: `POST /api/auth/login`
- **功能**: 用户登录，返回JWT token
- **请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **响应**: 返回用户信息和token

#### 3. 获取当前用户信息
- **路径**: `GET /api/auth/me`
- **功能**: 获取当前登录用户的完整信息
- **认证**: 需要登录（Bearer token或Cookie）
- **响应**: 返回用户信息和资料

### 二、用户相关 API

#### 1. 获取用户信息
- **路径**: `GET /api/users/[userId]`
- **功能**: 获取指定用户的公开信息
- **响应**: 包含用户基本信息、资料和统计信息

#### 2. 获取/更新用户资料
- **路径**: `GET /api/users/profile` - 获取当前用户资料
- **路径**: `PUT /api/users/profile` - 更新当前用户资料
- **认证**: 需要登录
- **请求体** (PUT):
```json
{
  "display_name": "显示名称",
  "bio": "个人简介",
  "location": "所在地",
  "website": "https://example.com",
  "birthday": "1990-01-01",
  "gender": "男",
  "social_links": {
    "twitter": "https://twitter.com/username",
    "github": "https://github.com/username"
  },
  "theme_color": "#FF5733"
}
```

### 三、留言板相关 API

#### 1. 获取留言列表
- **路径**: `GET /api/messages`
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20，最大100）
  - `sort`: 排序方式（newest/oldest/popular，默认newest）
  - `user_id`: 筛选特定用户的留言（可选）
- **响应**: 返回留言列表和分页信息，每条留言包含前3条回复

#### 2. 创建留言
- **路径**: `POST /api/messages`
- **认证**: 需要登录
- **请求体**:
```json
{
  "content": "留言内容（最多150字）",
  "is_public": true,
  "parent_message_id": "uuid（可选，用于回复）"
}
```
- **验证规则**: 留言内容不能为空，不能超过150字

#### 3. 获取/更新/删除单条留言
- **路径**: `GET /api/messages/[messageId]` - 获取单条留言（包含所有回复）
- **路径**: `PUT /api/messages/[messageId]` - 更新留言（只能更新自己的）
- **路径**: `DELETE /api/messages/[messageId]` - 删除留言（只能删除自己的，管理员可删除任何）

#### 4. 点赞/取消点赞留言
- **路径**: `POST /api/messages/[messageId]/like`
- **认证**: 需要登录
- **功能**: 切换点赞状态（如果已点赞则取消，未点赞则点赞）

### 四、每日故事抽奖 API

#### 1. 获取今日故事
- **路径**: `GET /api/stories/daily`
- **功能**: 获取当天的故事（用于展示）
- **响应**: 返回今日故事信息，自动增加查看次数

#### 2. 抽奖获取故事
- **路径**: `POST /api/stories/draw`
- **认证**: 需要登录
- **功能**: 用户进行每日故事抽奖
- **请求体**:
```json
{
  "date": "2024-01-01" // 可选，默认为今天
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "story": {
      "id": "uuid",
      "title": "故事标题",
      "content": "故事内容",
      "rarity": "common" // 抽中的稀有度
    },
    "draw_record": {
      "id": "uuid",
      "draw_date": "2024-01-01",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "is_first_draw_today": true
  }
}
```
- **抽奖规则**:
  - 每个用户每天只能抽一次（由数据库唯一约束保证）
  - 如果今天已抽过，返回已抽中的故事
  - 稀有度概率：common 60%, rare 25%, epic 10%, legendary 5%

#### 3. 获取抽奖历史
- **路径**: `GET /api/stories/history`
- **认证**: 需要登录
- **查询参数**: `page`, `limit`
- **响应**: 返回用户的抽奖历史记录

## 认证方式

所有需要认证的API支持两种方式：

1. **Bearer Token** (推荐):
```
Authorization: Bearer <token>
```

2. **Cookie**:
```
Cookie: token=<token>
```

## 错误响应格式

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

常见错误码：
- `VALIDATION_ERROR`: 验证失败
- `UNAUTHORIZED`: 未授权
- `FORBIDDEN`: 无权访问
- `NOT_FOUND`: 资源不存在
- `USERNAME_EXISTS`: 用户名已存在
- `EMAIL_EXISTS`: 邮箱已存在
- `INVALID_CREDENTIALS`: 邮箱或密码错误
- `ALREADY_DRAWN_TODAY`: 今天已经抽过奖
- `DATABASE_ERROR`: 数据库错误
- `SERVER_ERROR`: 服务器错误

## 环境变量配置

在 `.env.local` 文件中配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## 业务规则实现

✅ **用户名验证**: 不超过5个汉字，只能包含汉字、字母、数字、下划线
✅ **注册序号**: 使用SERIAL类型自动递增，注册时自动分配
✅ **留言字数限制**: 最多150字
✅ **每日抽奖限制**: 通过数据库唯一约束 `UNIQUE(user_id, draw_date)` 保证每个用户每天只能抽一次
✅ **密码加密**: 使用bcryptjs，SALT_ROUNDS=10
✅ **JWT认证**: 支持Bearer Token和Cookie两种方式

## 下一步

1. 安装依赖: `npm install`
2. 配置环境变量: 复制 `.env.example` 到 `.env.local` 并填入Supabase配置
3. 启动开发服务器: `npm run dev`
4. 测试API: 使用Postman或curl测试各个接口

