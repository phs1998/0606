# AOI个人介绍与轻社区网站 - 项目结构规划

## 技术栈
- **前端框架**: Next.js 14+ (App Router)
- **UI框架**: React 18+
- **样式**: Tailwind CSS
- **后端**: Node.js (Next.js API Routes)
- **数据库**: PostgreSQL
- **认证**: JWT (JSON Web Token)
- **ORM/查询**: Prisma 或直接使用 pg

## 项目目录结构

```
aoi5/
├── .env.local                 # 环境变量配置
├── .env.example              # 环境变量示例
├── .gitignore                # Git忽略文件
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript配置
├── tailwind.config.ts        # Tailwind CSS配置
├── postcss.config.js         # PostCSS配置
├── next.config.js            # Next.js配置
├── prisma/                   # Prisma ORM配置（如果使用）
│   ├── schema.prisma
│   └── migrations/
├── public/                   # 静态资源
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 首页
│   │   ├── globals.css       # 全局样式
│   │   ├── (auth)/           # 认证相关路由组
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (main)/           # 主内容路由组
│   │   │   ├── profile/
│   │   │   │   ├── [userId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   ├── story/        # 每日故事抽奖
│   │   │   │   └── page.tsx
│   │   │   └── board/        # 留言板
│   │   │       └── page.tsx
│   │   └── api/              # API路由
│   │       ├── auth/
│   │       │   ├── register/
│   │       │   │   └── route.ts
│   │       │   ├── login/
│   │       │   │   └── route.ts
│   │       │   └── logout/
│   │       │       └── route.ts
│   │       ├── users/
│   │       │   ├── [userId]/
│   │       │   │   └── route.ts
│   │       │   └── profile/
│   │       │       └── route.ts
│   │       ├── stories/
│   │       │   ├── daily/
│   │       │   │   └── route.ts
│   │       │   └── draw/
│   │       │       └── route.ts
│   │       └── messages/
│   │           ├── route.ts
│   │           └── [messageId]/
│   │               └── route.ts
│   ├── components/            # React组件
│   │   ├── ui/               # 基础UI组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/           # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── auth/             # 认证相关组件
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── profile/          # 个人主页组件
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── ProfileEdit.tsx
│   │   │   └── UserStats.tsx
│   │   ├── story/            # 故事抽奖组件
│   │   │   ├── StoryDraw.tsx
│   │   │   └── StoryCard.tsx
│   │   └── board/            # 留言板组件
│   │       ├── MessageList.tsx
│   │       ├── MessageForm.tsx
│   │       └── MessageItem.tsx
│   ├── lib/                  # 工具库
│   │   ├── db/               # 数据库相关
│   │   │   ├── connection.ts
│   │   │   └── queries.ts
│   │   ├── auth/             # 认证工具
│   │   │   ├── jwt.ts
│   │   │   └── middleware.ts
│   │   ├── utils/            # 通用工具函数
│   │   │   ├── validation.ts
│   │   │   └── format.ts
│   │   └── types/            # TypeScript类型定义
│   │       ├── user.ts
│   │       ├── message.ts
│   │       └── story.ts
│   ├── hooks/                # React Hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   └── useMessages.ts
│   └── styles/               # 样式文件
│       └── components.css
├── scripts/                  # 脚本文件
│   ├── init-db.sql          # 数据库初始化脚本
│   └── seed.ts              # 数据种子脚本
└── README.md                # 项目说明文档
```

## 目录说明

### `/src/app`
Next.js 14+ App Router 主目录，包含所有页面和API路由。

### `/src/components`
可复用的React组件，按功能分类组织。

### `/src/lib`
工具函数和库文件，包括数据库连接、认证逻辑等。

### `/src/hooks`
自定义React Hooks，用于状态管理和数据获取。

### `/public`
静态资源文件，如图片、图标等。

### `/prisma` (可选)
如果使用Prisma ORM，包含数据库schema和迁移文件。

## 路由规划

### 公开路由
- `/` - 首页（介绍页面）
- `/login` - 登录页
- `/register` - 注册页
- `/profile/[userId]` - 用户个人主页（公开）

### 受保护路由（需要登录）
- `/profile/edit` - 编辑个人资料
- `/story` - 每日故事抽奖
- `/board` - 留言板

### API路由
- `/api/auth/*` - 认证相关API
- `/api/users/*` - 用户相关API
- `/api/stories/*` - 故事相关API
- `/api/messages/*` - 留言相关API

