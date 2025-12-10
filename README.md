# AOI个人介绍与轻社区网站

一个基于Next.js、React、Tailwind CSS、Node.js和PostgreSQL的个人介绍与轻社区网站。

## 功能特性

- ✅ 用户注册（含唯一昵称和注册序号）
- ✅ 用户登录/登出
- ✅ 个人主页展示与编辑
- ✅ 每日故事抽奖系统
- ✅ 留言板功能（支持回复和点赞）

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **UI框架**: React 18+
- **样式**: Tailwind CSS
- **后端**: Node.js (Next.js API Routes)
- **数据库**: PostgreSQL
- **认证**: JWT (JSON Web Token)

## 项目结构

详细的项目目录结构请参考 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 数据库设计

详细的数据库表结构和建表SQL请参考：
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - 数据库设计文档
- [scripts/init-db.sql](./scripts/init-db.sql) - 数据库初始化SQL脚本

## API接口文档

详细的API接口设计请参考 [API_DESIGN.md](./API_DESIGN.md)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/aoi5

# JWT密钥
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Next.js配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 初始化数据库

```bash
# 创建数据库
createdb aoi5

# 运行初始化脚本
npm run db:init
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 开发计划

- [ ] 实现用户注册和登录功能
- [ ] 实现个人主页展示和编辑
- [ ] 实现每日故事抽奖系统
- [ ] 实现留言板功能
- [ ] 添加响应式设计
- [ ] 添加图片上传功能
- [ ] 添加管理员功能

## 许可证

MIT

