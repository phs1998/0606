# API接口设计文档

## API概述
所有API路由位于 `/api` 路径下，使用Next.js App Router的Route Handlers实现。

## 认证方式
- 使用JWT (JSON Web Token)进行身份认证
- Token存储在HTTP-only Cookie中（推荐）或Authorization Header中
- Token格式: `Bearer <token>`

## 响应格式标准

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## API接口列表

### 一、认证相关 API (`/api/auth`)

#### 1. 用户注册
- **路径**: `POST /api/auth/register`
- **描述**: 注册新用户，自动分配唯一昵称和注册序号
- **请求体**:
```json
{
  "username": "string (必填, 3-50字符, 唯一)",
  "email": "string (必填, 有效邮箱格式)",
  "password": "string (必填, 最少8字符)"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "registration_number": "number",
      "created_at": "timestamp"
    },
    "token": "jwt_token"
  }
}
```
- **错误码**:
  - `USERNAME_EXISTS`: 用户名已存在
  - `EMAIL_EXISTS`: 邮箱已存在
  - `VALIDATION_ERROR`: 验证失败

#### 2. 用户登录
- **路径**: `POST /api/auth/login`
- **描述**: 用户登录，返回JWT token
- **请求体**:
```json
{
  "email": "string (必填)",
  "password": "string (必填)"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "registration_number": "number",
      "avatar_url": "string | null"
    },
    "token": "jwt_token"
  }
}
```
- **错误码**:
  - `INVALID_CREDENTIALS`: 邮箱或密码错误
  - `ACCOUNT_INACTIVE`: 账户未激活

#### 3. 用户登出
- **路径**: `POST /api/auth/logout`
- **描述**: 登出当前用户，清除token
- **认证**: 需要登录
- **响应**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

#### 4. 获取当前用户信息
- **路径**: `GET /api/auth/me`
- **描述**: 获取当前登录用户的信息
- **认证**: 需要登录
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "registration_number": "number",
    "avatar_url": "string | null",
    "profile": {
      "display_name": "string | null",
      "bio": "string | null",
      ...
    }
  }
}
```

#### 5. 刷新Token
- **路径**: `POST /api/auth/refresh`
- **描述**: 刷新JWT token
- **认证**: 需要登录
- **响应**:
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token"
  }
}
```

---

### 二、用户相关 API (`/api/users`)

#### 1. 获取用户信息
- **路径**: `GET /api/users/[userId]`
- **描述**: 获取指定用户的公开信息
- **参数**: `userId` (路径参数)
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "registration_number": "number",
    "avatar_url": "string | null",
    "profile": {
      "display_name": "string | null",
      "bio": "string | null",
      "location": "string | null",
      "website": "string | null",
      "social_links": {},
      "theme_color": "string | null"
    },
    "stats": {
      "message_count": "number",
      "story_draw_count": "number"
    },
    "created_at": "timestamp"
  }
}
```

#### 2. 更新用户资料
- **路径**: `PUT /api/users/profile`
- **描述**: 更新当前用户的个人资料
- **认证**: 需要登录
- **请求体**:
```json
{
  "display_name": "string (可选)",
  "bio": "string (可选)",
  "location": "string (可选)",
  "website": "string (可选)",
  "birthday": "date (可选, YYYY-MM-DD)",
  "gender": "string (可选)",
  "social_links": {
    "twitter": "string (可选)",
    "github": "string (可选)",
    "instagram": "string (可选)"
  },
  "theme_color": "string (可选, 十六进制颜色)"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "profile": { ... }
  }
}
```

#### 3. 上传头像
- **路径**: `POST /api/users/avatar`
- **描述**: 上传用户头像
- **认证**: 需要登录
- **请求**: `multipart/form-data`
  - `file`: 图片文件 (必填, 最大5MB, 支持jpg/png/webp)
- **响应**:
```json
{
  "success": true,
  "data": {
    "avatar_url": "string"
  }
}
```

#### 4. 检查用户名是否可用
- **路径**: `GET /api/users/check-username?username=xxx`
- **描述**: 检查用户名是否已被使用
- **查询参数**: `username` (必填)
- **响应**:
```json
{
  "success": true,
  "data": {
    "available": "boolean"
  }
}
```

---

### 三、每日故事相关 API (`/api/stories`)

#### 1. 获取今日故事
- **路径**: `GET /api/stories/daily`
- **描述**: 获取当天的故事（用于展示）
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "author": "string | null",
    "category": "string",
    "rarity": "string",
    "image_url": "string | null",
    "date": "date",
    "view_count": "number",
    "draw_count": "number"
  }
}
```

#### 2. 抽奖获取故事
- **路径**: `POST /api/stories/draw`
- **描述**: 用户进行每日故事抽奖
- **认证**: 需要登录
- **请求体**:
```json
{
  "date": "date (可选, 默认为今天, 格式: YYYY-MM-DD)"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "story": {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "rarity": "string",
      "image_url": "string | null"
    },
    "draw_record": {
      "id": "uuid",
      "draw_date": "date",
      "created_at": "timestamp"
    },
    "is_first_draw_today": "boolean"
  }
}
```
- **错误码**:
  - `ALREADY_DRAWN_TODAY`: 今天已经抽过奖了
  - `NO_STORY_AVAILABLE`: 今天没有可用的故事

#### 3. 获取用户抽奖历史
- **路径**: `GET /api/stories/history`
- **描述**: 获取当前用户的抽奖历史记录
- **认证**: 需要登录
- **查询参数**:
  - `page`: 页码 (可选, 默认1)
  - `limit`: 每页数量 (可选, 默认20)
- **响应**:
```json
{
  "success": true,
  "data": {
    "draws": [
      {
        "id": "uuid",
        "story": {
          "id": "uuid",
          "title": "string",
          "rarity": "string",
          "image_url": "string | null"
        },
        "draw_date": "date",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "total_pages": "number"
    }
  }
}
```

#### 4. 获取故事统计
- **路径**: `GET /api/stories/stats`
- **描述**: 获取故事相关的统计数据
- **认证**: 需要登录（可选，未登录返回公开统计）
- **响应**:
```json
{
  "success": true,
  "data": {
    "total_stories": "number",
    "total_draws": "number",
    "rarity_distribution": {
      "common": "number",
      "rare": "number",
      "epic": "number",
      "legendary": "number"
    },
    "user_stats": {
      "total_draws": "number",
      "last_draw_date": "date | null"
    }
  }
}
```

---

### 四、留言板相关 API (`/api/messages`)

#### 1. 获取留言列表
- **路径**: `GET /api/messages`
- **描述**: 获取留言板中的留言列表
- **查询参数**:
  - `page`: 页码 (可选, 默认1)
  - `limit`: 每页数量 (可选, 默认20)
  - `sort`: 排序方式 (可选, `newest` | `oldest` | `popular`, 默认`newest`)
  - `user_id`: 用户ID (可选, 筛选特定用户的留言)
- **响应**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "username": "string",
          "avatar_url": "string | null",
          "registration_number": "number"
        },
        "content": "string",
        "like_count": "number",
        "reply_count": "number",
        "is_liked": "boolean (仅登录用户)",
        "is_pinned": "boolean",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "replies": [
          {
            "id": "uuid",
            "user": { ... },
            "content": "string",
            "like_count": "number",
            "created_at": "timestamp"
          }
        ]
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "total_pages": "number"
    }
  }
}
```

#### 2. 创建留言
- **路径**: `POST /api/messages`
- **描述**: 发布新留言
- **认证**: 需要登录
- **请求体**:
```json
{
  "content": "string (必填, 1-2000字符)",
  "is_public": "boolean (可选, 默认true)",
  "parent_message_id": "uuid (可选, 用于回复)"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "content": "string",
      "user_id": "uuid",
      "like_count": 0,
      "reply_count": 0,
      "created_at": "timestamp"
    }
  }
}
```
- **错误码**:
  - `VALIDATION_ERROR`: 内容验证失败
  - `PARENT_NOT_FOUND`: 父留言不存在（回复时）

#### 3. 获取单条留言
- **路径**: `GET /api/messages/[messageId]`
- **描述**: 获取单条留言的详细信息（包括所有回复）
- **参数**: `messageId` (路径参数)
- **响应**:
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "user": { ... },
      "content": "string",
      "like_count": "number",
      "reply_count": "number",
      "is_liked": "boolean",
      "replies": [ ... ],
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

#### 4. 更新留言
- **路径**: `PUT /api/messages/[messageId]`
- **描述**: 更新自己的留言
- **认证**: 需要登录，且只能更新自己的留言
- **参数**: `messageId` (路径参数)
- **请求体**:
```json
{
  "content": "string (必填)"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "message": { ... }
  }
}
```
- **错误码**:
  - `FORBIDDEN`: 无权修改此留言
  - `NOT_FOUND`: 留言不存在

#### 5. 删除留言
- **路径**: `DELETE /api/messages/[messageId]`
- **描述**: 删除自己的留言（管理员可删除任何留言）
- **认证**: 需要登录
- **参数**: `messageId` (路径参数)
- **响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```
- **错误码**:
  - `FORBIDDEN`: 无权删除此留言
  - `NOT_FOUND`: 留言不存在

#### 6. 点赞/取消点赞留言
- **路径**: `POST /api/messages/[messageId]/like`
- **描述**: 点赞或取消点赞留言
- **认证**: 需要登录
- **参数**: `messageId` (路径参数)
- **响应**:
```json
{
  "success": true,
  "data": {
    "is_liked": "boolean",
    "like_count": "number"
  }
}
```

#### 7. 置顶留言（管理员）
- **路径**: `POST /api/messages/[messageId]/pin`
- **描述**: 置顶或取消置顶留言（仅管理员）
- **认证**: 需要登录，且需要管理员权限
- **参数**: `messageId` (路径参数)
- **请求体**:
```json
{
  "is_pinned": "boolean"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "message": { ... }
  }
}
```

---

## HTTP状态码

- `200 OK`: 请求成功
- `201 Created`: 创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或token无效
- `403 Forbidden`: 无权限
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如用户名已存在）
- `422 Unprocessable Entity`: 验证失败
- `500 Internal Server Error`: 服务器错误

## 分页参数

所有支持分页的接口使用以下参数：
- `page`: 页码，从1开始
- `limit`: 每页数量，默认20，最大100

响应中包含分页信息：
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

## 错误处理

所有错误响应遵循统一格式：
```json
{
  "success": false,
  "error": "错误描述信息",
  "code": "ERROR_CODE",
  "details": {} // 可选，包含详细错误信息
}
```

## 速率限制建议

- 注册/登录: 5次/分钟
- 创建留言: 10次/分钟
- 抽奖: 1次/天（由业务逻辑保证）
- 其他API: 60次/分钟

